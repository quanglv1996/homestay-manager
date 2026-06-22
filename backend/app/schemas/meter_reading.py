from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class MeterReadingBase(BaseModel):
    room_id: int
    reading_date: date
    period_start: date
    period_end: date
    electricity_previous: Decimal = Field(default=0, ge=0)
    electricity_current: Decimal = Field(default=0, ge=0)
    electricity_price: Decimal = Field(default=0, ge=0)
    water_previous: Decimal = Field(default=0, ge=0)
    water_current: Decimal = Field(default=0, ge=0)
    water_price: Decimal = Field(default=0, ge=0)
    notes: Optional[str] = None


class MeterReadingCreate(MeterReadingBase):
    pass


class MeterReadingUpdate(BaseModel):
    electricity_current: Optional[Decimal] = Field(None, ge=0)
    electricity_price: Optional[Decimal] = Field(None, ge=0)
    water_current: Optional[Decimal] = Field(None, ge=0)
    water_price: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None


class MeterReadingResponse(MeterReadingBase):
    id: int
    electricity_usage: Decimal
    electricity_amount: Decimal
    water_usage: Decimal
    water_amount: Decimal
    electricity_image: Optional[str] = None
    water_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MeterReadingWithDetails(MeterReadingResponse):
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    property_name: Optional[str] = None
