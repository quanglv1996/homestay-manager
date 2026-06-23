"""
Audit Log utilities and decorators
"""
from functools import wraps
from typing import Optional, Dict, Any, Callable
from datetime import datetime, date
from decimal import Decimal
from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog, AuditAction
from app.models.user import User


def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Check for X-Real-IP header (nginx)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    if request.client:
        return request.client.host
    
    return "unknown"


def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("User-Agent", "unknown")


def create_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    description: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Create an audit log entry
    
    Args:
        db: Database session
        user_id: ID of user performing action
        action: Action type (CREATE, UPDATE, DELETE, etc.)
        entity_type: Type of entity (property, room, tenant, etc.)
        entity_id: ID of entity
        description: Human-readable description
        old_value: Value before change (for UPDATE)
        new_value: Value after change (for CREATE/UPDATE)
        ip_address: Client IP address
        user_agent: Client user agent
    
    Returns:
        Created audit log entry
    """
    # Calculate changes if both old and new values provided
    changes = None
    if old_value and new_value:
        changes = {}
        all_keys = set(old_value.keys()) | set(new_value.keys())
        for key in all_keys:
            old_val = old_value.get(key)
            new_val = new_value.get(key)
            if old_val != new_val:
                changes[key] = {
                    "old": old_val,
                    "new": new_val
                }
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        old_value=old_value,
        new_value=new_value,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return audit_log


def log_action(
    action: str,
    entity_type: Optional[str] = None,
    description_template: Optional[str] = None
):
    """
    Decorator to automatically log actions
    
    Usage:
        @log_action("CREATE", "property", "Created property {entity_id}")
        async def create_property(...):
            ...
    
    The decorated function should return a dict with:
        - entity_id: ID of the entity
        - old_value: Value before change (optional)
        - new_value: Value after change (optional)
        - Or return the entity object directly
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Extract db and request from kwargs
            db: Optional[Session] = kwargs.get("db")
            request: Optional[Request] = kwargs.get("request")
            current_user: Optional[User] = kwargs.get("current_user")
            
            # Call the original function
            result = await func(*args, **kwargs)
            
            # Try to log if db and user are available
            if db and current_user:
                try:
                    # Extract entity info from result
                    entity_id = None
                    old_value = None
                    new_value = None
                    
                    if isinstance(result, dict):
                        entity_id = result.get("id") or result.get("entity_id")
                        old_value = result.get("old_value")
                        new_value = result.get("new_value") or result
                    elif hasattr(result, "id"):
                        # Result is an ORM object
                        entity_id = result.id
                        new_value = {c.name: getattr(result, c.name) for c in result.__table__.columns}
                    
                    # Build description
                    description = description_template
                    if description and entity_id:
                        description = description.format(entity_id=entity_id)
                    
                    # Get IP and user agent
                    ip_address = None
                    user_agent = None
                    if request:
                        ip_address = get_client_ip(request)
                        user_agent = get_user_agent(request)
                    
                    # Create audit log
                    create_audit_log(
                        db=db,
                        user_id=current_user.id,
                        action=action,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        description=description,
                        old_value=old_value,
                        new_value=new_value,
                        ip_address=ip_address,
                        user_agent=user_agent,
                    )
                except Exception as e:
                    # Don't fail the request if audit logging fails
                    print(f"Failed to create audit log: {e}")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # For sync functions
            db: Optional[Session] = kwargs.get("db")
            request: Optional[Request] = kwargs.get("request")
            current_user: Optional[User] = kwargs.get("current_user")
            
            result = func(*args, **kwargs)
            
            if db and current_user:
                try:
                    entity_id = None
                    old_value = None
                    new_value = None
                    
                    if isinstance(result, dict):
                        entity_id = result.get("id") or result.get("entity_id")
                        old_value = result.get("old_value")
                        new_value = result.get("new_value") or result
                    elif hasattr(result, "id"):
                        entity_id = result.id
                        new_value = {c.name: getattr(result, c.name) for c in result.__table__.columns}
                    
                    description = description_template
                    if description and entity_id:
                        description = description.format(entity_id=entity_id)
                    
                    ip_address = None
                    user_agent = None
                    if request:
                        ip_address = get_client_ip(request)
                        user_agent = get_user_agent(request)
                    
                    create_audit_log(
                        db=db,
                        user_id=current_user.id,
                        action=action,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        description=description,
                        old_value=old_value,
                        new_value=new_value,
                        ip_address=ip_address,
                        user_agent=user_agent,
                    )
                except Exception as e:
                    print(f"Failed to create audit log: {e}")
            
            return result
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def model_to_dict(obj: Any, exclude_fields: Optional[list] = None) -> Dict[str, Any]:
    """
    Convert SQLAlchemy model to dict for audit logging
    
    Args:
        obj: SQLAlchemy model instance
        exclude_fields: List of fields to exclude (e.g., ['hashed_password'])
    
    Returns:
        Dictionary representation of model
    """
    if exclude_fields is None:
        exclude_fields = ['hashed_password', 'password']
    
    result = {}
    for column in obj.__table__.columns:
        if column.name not in exclude_fields:
            value = getattr(obj, column.name)
            # Convert datetime to string for JSON serialization
            if isinstance(value, datetime):
                value = value.isoformat()
            # Convert date to string for JSON serialization
            elif isinstance(value, date):
                value = value.isoformat()
            # Convert Decimal to float for JSON serialization
            elif isinstance(value, Decimal):
                value = float(value)
            # Convert enums to string
            elif hasattr(value, 'value'):
                value = value.value
            result[column.name] = value
    
    return result
