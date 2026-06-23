"""Properties endpoint - with soft delete, audit log, and validations"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.core.audit import create_audit_log, get_client_ip, get_user_agent, model_to_dict
from app.models import Property, Floor, Room, Contract, Invoice
from app.models.room import RoomStatus
from app.models.contract import ContractStatus
from app.models.invoice import InvoiceStatus
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse, FloorCreate, FloorUpdate
from app.schemas.common import PaginatedResponse, MessageResponse
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PropertyResponse])
def list_properties(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """List all properties (non-deleted only)"""
    query = db.query(Property).filter(Property.is_deleted == False)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}


@router.post("", response_model=PropertyResponse)
def create_property(
    data: PropertyCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new property"""
    property = Property(**data.dict(exclude={"auto_generate_rooms", "floors_to_generate", "rooms_per_floor"}))
    db.add(property)
    db.flush()
    
    # Auto-generate floors if requested
    if hasattr(data, 'floors_to_generate') and data.floors_to_generate:
        for floor_num in range(1, data.floors_to_generate + 1):
            floor = Floor(
                property_id=property.id,
                floor_number=floor_num,
                floor_name=f"Tầng {floor_num}"
            )
            db.add(floor)
    
    db.commit()
    db.refresh(property)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="property",
        entity_id=property.id,
        description=f"Created property {property.name}",
        new_value=model_to_dict(property),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return property


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get property by ID"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_deleted == False
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return property


@router.get("/{property_id}/stats")
def get_property_stats(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get property statistics"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_deleted == False
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Count rooms by status
    total_rooms = db.query(Room).filter(
        Room.property_id == property_id,
        Room.is_deleted == False
    ).count()
    
    available_rooms = db.query(Room).filter(
        Room.property_id == property_id,
        Room.status == RoomStatus.AVAILABLE,
        Room.is_deleted == False
    ).count()
    
    occupied_rooms = db.query(Room).filter(
        Room.property_id == property_id,
        Room.status == RoomStatus.OCCUPIED,
        Room.is_deleted == False
    ).count()
    
    maintenance_rooms = db.query(Room).filter(
        Room.property_id == property_id,
        Room.status == RoomStatus.MAINTENANCE,
        Room.is_deleted == False
    ).count()
    
    # Count floors
    total_floors = db.query(Floor).filter(
        Floor.property_id == property_id
    ).count()
    
    return {
        "property_id": property_id,
        "property_name": property.name,
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "occupied_rooms": occupied_rooms,
        "maintenance_rooms": maintenance_rooms,
        "total_floors": total_floors,
        "occupancy_rate": round((occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0, 2)
    }


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_deleted == False
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Save old values for audit
    old_value = model_to_dict(property)
    
    # Update fields
    for field, value in data.dict(exclude_unset=True).items():
        setattr(property, field, value)
    
    db.commit()
    db.refresh(property)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="property",
        entity_id=property.id,
        description=f"Updated property {property.name}",
        old_value=old_value,
        new_value=model_to_dict(property),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return property


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Soft delete property with validation"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_deleted == False
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Validation: Check for active contracts
    active_contracts = db.query(Contract).join(Room).filter(
        Room.property_id == property_id,
        Contract.status.in_([ContractStatus.ACTIVE, ContractStatus.DRAFT]),
        Contract.is_deleted == False
    ).count()
    
    if active_contracts > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete property. There are {active_contracts} active contract(s). Please terminate all contracts first."
        )
    
    # Validation: Check for unpaid invoices
    unpaid_invoices = db.query(Invoice).join(Contract).join(Room).filter(
        Room.property_id == property_id,
        Invoice.status.in_([InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE]),
        Invoice.is_deleted == False
    ).count()
    
    if unpaid_invoices > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete property. There are {unpaid_invoices} unpaid invoice(s). Please settle all invoices first."
        )
    
    # Soft delete
    old_value = model_to_dict(property)
    property.is_deleted = True
    property.deleted_at = datetime.utcnow()
    property.deleted_by_id = current_user.id
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="property",
        entity_id=property.id,
        description=f"Deleted property {property.name}",
        old_value=old_value,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    
    return {"message": "Property deleted successfully"}


# Floor management endpoints
@router.get("/{property_id}/floors")
def list_floors(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all floors of a property"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_deleted == False
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    floors = db.query(Floor).filter(
        Floor.property_id == property_id
    ).order_by(Floor.floor_number).all()
    
    return floors


@router.post("/{property_id}/floors")
def create_floor(
    property_id: int,
    data: FloorCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new floor"""
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.is_deleted == False
    ).first()
    
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    floor = Floor(**data.dict(), property_id=property_id)
    db.add(floor)
    db.commit()
    db.refresh(floor)
    
    # Update property total_floors
    property.total_floors = db.query(Floor).filter(Floor.property_id == property_id).count()
    db.commit()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="floor",
        entity_id=floor.id,
        description=f"Created floor {floor.floor_name} in property {property.name}",
        new_value={"floor_number": floor.floor_number, "floor_name": floor.floor_name},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return floor


@router.delete("/{property_id}/floors/{floor_id}")
def delete_floor(
    property_id: int,
    floor_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete floor"""
    floor = db.query(Floor).filter(
        Floor.id == floor_id,
        Floor.property_id == property_id
    ).first()
    
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    
    # Check if floor has rooms
    rooms_count = db.query(Room).filter(Room.floor_id == floor_id).count()
    if rooms_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete floor. There are {rooms_count} room(s) on this floor. Please delete or move rooms first."
        )
    
    db.delete(floor)
    db.commit()
    
    # Update property total_floors
    property = db.query(Property).filter(Property.id == property_id).first()
    if property:
        property.total_floors = db.query(Floor).filter(Floor.property_id == property_id).count()
        db.commit()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="floor",
        entity_id=floor_id,
        description=f"Deleted floor {floor.floor_name}",
        old_value={"floor_number": floor.floor_number, "floor_name": floor.floor_name},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {"message": "Floor deleted successfully"}
