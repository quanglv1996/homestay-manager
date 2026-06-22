from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.room import RoomStatus


class BedBase(BaseModel):
    bed_code: str
    bed_name: str
    is_occupied: bool = False


class BedCreate(BedBase):
    room_id: int


class BedUpdate(BaseModel):
    bed_name: Optional[str] = None
    is_occupied: Optional[bool] = None


class BedResponse(BedBase):
    id: int
    room_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    room_code: str = Field(..., max_length=50)
    room_name: str = Field(..., max_length=255)
    area: Optional[Decimal] = Field(None, ge=0)
    capacity: int = Field(default=1, ge=1)
    rent_price: Decimal = Field(..., ge=0)
    electricity_price: Optional[Decimal] = Field(None, ge=0)
    water_price: Optional[Decimal] = Field(None, ge=0)
    internet_fee: Optional[Decimal] = Field(None, ge=0)
    cleaning_fee: Optional[Decimal] = Field(None, ge=0)
    parking_fee: Optional[Decimal] = Field(None, ge=0)
    other_fees: Decimal = Field(default=0, ge=0)
    status: RoomStatus = RoomStatus.AVAILABLE
    is_dormitory: bool = False
    description: Optional[str] = None
    amenities: Optional[str] = None


class RoomCreate(RoomBase):
    property_id: int
    floor_id: Optional[int] = None
    # For dormitory
    number_of_beds: Optional[int] = None


class RoomUpdate(BaseModel):
    room_name: Optional[str] = None
    area: Optional[Decimal] = Field(None, ge=0)
    capacity: Optional[int] = Field(None, ge=1)
    rent_price: Optional[Decimal] = Field(None, ge=0)
    electricity_price: Optional[Decimal] = Field(None, ge=0)
    water_price: Optional[Decimal] = Field(None, ge=0)
    internet_fee: Optional[Decimal] = Field(None, ge=0)
    cleaning_fee: Optional[Decimal] = Field(None, ge=0)
    parking_fee: Optional[Decimal] = Field(None, ge=0)
    other_fees: Optional[Decimal] = Field(None, ge=0)
    status: Optional[RoomStatus] = None
    description: Optional[str] = None
    amenities: Optional[str] = None


class RoomResponse(RoomBase):
    id: int
    property_id: int
    floor_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    beds: list[BedResponse] = []
    
    class Config:
        from_attributes = True


class RoomWithDetails(RoomResponse):
    property_name: Optional[str] = None
    floor_name: Optional[str] = None
    current_tenant: Optional[str] = None
    contract_end_date: Optional[datetime] = None
