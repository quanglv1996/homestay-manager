from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class TenantBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    date_of_birth: Optional[date] = None
    id_card_number: Optional[str] = Field(None, max_length=20)
    id_card_issue_date: Optional[date] = None
    id_card_issue_place: Optional[str] = None
    phone: str = Field(..., max_length=20)
    email: Optional[str] = None
    permanent_address: Optional[str] = None
    vehicle_plate: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    occupation: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    date_of_birth: Optional[date] = None
    id_card_number: Optional[str] = None
    id_card_issue_date: Optional[date] = None
    id_card_issue_place: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    permanent_address: Optional[str] = None
    vehicle_plate: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    occupation: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


class TenantResponse(TenantBase):
    id: int
    id_card_front_image: Optional[str] = None
    id_card_back_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TenantWithContracts(TenantResponse):
    active_contracts_count: int = 0
    total_contracts_count: int = 0
