"""
Audit Log endpoints
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.deps import get_db, get_current_user, require_role
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog, AuditAction
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("/audit-logs", dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))])
async def get_audit_logs(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    search: Optional[str] = None,
):
    """
    Get audit logs with filtering
    
    Requires: ADMIN or MANAGER role
    
    Filters:
    - user_id: Filter by user who performed action
    - action: Filter by action type (CREATE, UPDATE, DELETE, etc.)
    - entity_type: Filter by entity type (property, room, tenant, etc.)
    - entity_id: Filter by specific entity ID
    - from_date: Filter logs from this date
    - to_date: Filter logs to this date
    - search: Search in description
    """
    query = db.query(AuditLog)
    
    # Apply filters
    filters = []
    
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    
    if action:
        filters.append(AuditLog.action == action)
    
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    
    if entity_id:
        filters.append(AuditLog.entity_id == entity_id)
    
    if from_date:
        filters.append(AuditLog.created_at >= from_date)
    
    if to_date:
        # Add 1 day to include the entire day
        to_date_end = to_date + timedelta(days=1)
        filters.append(AuditLog.created_at < to_date_end)
    
    if search:
        filters.append(AuditLog.description.ilike(f"%{search}%"))
    
    if filters:
        query = query.filter(and_(*filters))
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": logs,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/audit-logs/{log_id}", dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))])
async def get_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get specific audit log by ID
    
    Requires: ADMIN or MANAGER role
    """
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    
    return log


@router.get("/audit-logs/entity/{entity_type}/{entity_id}", 
           dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))])
async def get_entity_audit_logs(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Get audit logs for a specific entity
    
    Requires: ADMIN or MANAGER role
    
    Example: GET /audit-logs/entity/property/123
    """
    query = db.query(AuditLog).filter(
        and_(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        )
    )
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": logs,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/audit-logs/stats/summary", 
           dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365),
):
    """
    Get audit log statistics
    
    Requires: ADMIN role only
    
    Returns statistics for the last N days
    """
    from_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(AuditLog).filter(AuditLog.created_at >= from_date)
    
    total_logs = query.count()
    
    # Count by action
    from sqlalchemy import func
    action_counts = (
        db.query(AuditLog.action, func.count(AuditLog.id))
        .filter(AuditLog.created_at >= from_date)
        .group_by(AuditLog.action)
        .all()
    )
    
    # Count by entity type
    entity_counts = (
        db.query(AuditLog.entity_type, func.count(AuditLog.id))
        .filter(AuditLog.created_at >= from_date)
        .group_by(AuditLog.entity_type)
        .all()
    )
    
    # Top users by activity
    top_users = (
        db.query(AuditLog.user_id, func.count(AuditLog.id).label('count'))
        .filter(AuditLog.created_at >= from_date)
        .filter(AuditLog.user_id.isnot(None))
        .group_by(AuditLog.user_id)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
        .all()
    )
    
    return {
        "period_days": days,
        "total_logs": total_logs,
        "by_action": {action: count for action, count in action_counts},
        "by_entity_type": {entity_type: count for entity_type, count in entity_counts},
        "top_users": [{"user_id": user_id, "count": count} for user_id, count in top_users],
    }
