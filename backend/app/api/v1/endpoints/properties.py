"""Properties endpoint - placeholder"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models import Property, Floor, Room
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse[PropertyResponse])
def list_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Property)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}

@router.post("", response_model=PropertyResponse)
def create_property(data: PropertyCreate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    property = Property(**data.dict(exclude={"auto_generate_rooms", "floors_to_generate", "rooms_per_floor"}))
    db.add(property)
    db.commit()
    db.refresh(property)
    return property

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: int, data: PropertyUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(property, field, value)
    db.commit()
    db.refresh(property)
    return property

@router.delete("/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(property)
    db.commit()
    return {"message": "Property deleted"}
