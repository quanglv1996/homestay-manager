from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.property import PropertyType


class FloorBase(BaseModel):
    floor_number: int
    floor_name: str
    description: Optional[str] = None


class FloorCreate(FloorBase):
    property_id: int


class FloorUpdate(BaseModel):
    floor_name: Optional[str] = None
    description: Optional[str] = None


class FloorResponse(FloorBase):
    id: int
    property_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PropertyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: PropertyType
    address: str
    description: Optional[str] = None
    total_floors: int = 0
    total_rooms: int = 0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    default_electricity_price: Decimal = Field(default=0, ge=0)
    default_water_price: Decimal = Field(default=0, ge=0)
    default_internet_fee: Decimal = Field(default=0, ge=0)
    default_cleaning_fee: Decimal = Field(default=0, ge=0)
    default_parking_fee: Decimal = Field(default=0, ge=0)


class PropertyCreate(PropertyBase):
    # For mini apartment auto-generation
    auto_generate_rooms: bool = False
    floors_to_generate: Optional[int] = None
    rooms_per_floor: Optional[int] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[PropertyType] = None
    address: Optional[str] = None
    description: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    default_electricity_price: Optional[Decimal] = Field(None, ge=0)
    default_water_price: Optional[Decimal] = Field(None, ge=0)
    default_internet_fee: Optional[Decimal] = Field(None, ge=0)
    default_cleaning_fee: Optional[Decimal] = Field(None, ge=0)
    default_parking_fee: Optional[Decimal] = Field(None, ge=0)


class PropertyResponse(PropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    floors: list[FloorResponse] = []
    
    class Config:
        from_attributes = True


class PropertyWithStats(PropertyResponse):
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    occupancy_rate: float
