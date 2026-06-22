from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.contract import ContractStatus, PaymentCycle


class ContractBase(BaseModel):
    tenant_id: int
    room_id: int
    bed_id: Optional[int] = None
    start_date: date
    end_date: date
    payment_day: int = Field(..., ge=1, le=31)
    payment_cycle: PaymentCycle = PaymentCycle.MONTHLY
    rent_amount: Decimal = Field(..., ge=0)
    deposit_amount: Decimal = Field(default=0, ge=0)
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    end_date: Optional[date] = None
    payment_day: Optional[int] = Field(None, ge=1, le=31)
    payment_cycle: Optional[PaymentCycle] = None
    rent_amount: Optional[Decimal] = Field(None, ge=0)
    deposit_amount: Optional[Decimal] = Field(None, ge=0)
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ContractStatus] = None


class ContractResponse(ContractBase):
    id: int
    contract_code: str
    status: ContractStatus
    signed_date: Optional[date] = None
    landlord_signature: Optional[str] = None
    tenant_signature: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ContractWithDetails(ContractResponse):
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    property_name: Optional[str] = None
    days_until_expiry: Optional[int] = None
    is_expiring_soon: bool = False
