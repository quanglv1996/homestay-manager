"""Rooms endpoint - with soft delete and audit log"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.core.audit import create_audit_log, get_client_ip, get_user_agent, model_to_dict
from app.models import Room, Bed, Contract
from app.models.room import RoomStatus
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.schemas.common import PaginatedResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse[RoomResponse])
def list_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Only show non-deleted rooms
    query = db.query(Room).filter(Room.is_deleted == False)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}

@router.post("", response_model=RoomResponse)
def create_room(
    data: RoomCreate, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_manager)
):
    room = Room(**data.dict(exclude={"number_of_beds"}))
    db.add(room)
    db.flush()
    
    # Create beds for dormitory
    if data.is_dormitory and data.number_of_beds:
        for i in range(1, data.number_of_beds + 1):
            bed = Bed(room_id=room.id, bed_code=f"{data.room_code}-B{i:02d}", bed_name=f"Giường {i}")
            db.add(bed)
    
    db.commit()
    db.refresh(room)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="room",
        entity_id=room.id,
        description=f"Created room {room.room_code}",
        new_value=model_to_dict(room),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return room

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == False).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int, 
    data: RoomUpdate, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_manager)
):
    room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == False).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Save old values for audit log
    old_value = model_to_dict(room)
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(room, field, value)
    
    db.commit()
    db.refresh(room)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="room",
        entity_id=room.id,
        description=f"Updated room {room.room_code}",
        old_value=old_value,
        new_value=model_to_dict(room),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return room

@router.delete("/{room_id}")
def delete_room(
    room_id: int, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_manager)
):
    room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == False).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check if room has active contracts
    active_contract = db.query(Contract).filter(
        Contract.room_id == room_id,
        Contract.status.in_(["ACTIVE", "PENDING"]),
        Contract.is_deleted == False
    ).first()
    
    if active_contract:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete room with active contracts. Please terminate contracts first."
        )
    
    # Soft delete
    old_value = model_to_dict(room)
    room.is_deleted = True
    room.deleted_at = datetime.utcnow()
    room.deleted_by_id = current_user.id
    
    db.commit()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="room",
        entity_id=room.id,
        description=f"Deleted room {room.room_code}",
        old_value=old_value,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {"message": "Room deleted successfully"}

