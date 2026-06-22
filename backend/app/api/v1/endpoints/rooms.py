"""Rooms endpoint - placeholder"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models import Room, Bed
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.schemas.common import PaginatedResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse[RoomResponse])
def list_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Room)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}

@router.post("", response_model=RoomResponse)
def create_room(data: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    room = Room(**data.dict(exclude={"number_of_beds"}))
    db.add(room)
    db.flush()
    if data.is_dormitory and data.number_of_beds:
        for i in range(1, data.number_of_beds + 1):
            bed = Bed(room_id=room.id, bed_code=f"{data.room_code}-B{i:02d}", bed_name=f"Giường {i}")
            db.add(bed)
    db.commit()
    db.refresh(room)
    return room

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, data: RoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
    return {"message": "Room deleted"}
