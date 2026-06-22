from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.invoice import InvoiceStatus


class InvoiceItemBase(BaseModel):
    description: str
    quantity: Decimal = Field(default=1, ge=0)
    unit_price: Decimal = Field(..., ge=0)
    amount: Decimal = Field(..., ge=0)
    item_type: Optional[str] = None
    meter_reading_id: Optional[int] = None


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    contract_id: int
    period_start: date
    period_end: date
    due_date: date
    subtotal: Decimal = Field(default=0, ge=0)
    tax: Decimal = Field(default=0, ge=0)
    discount: Decimal = Field(default=0, ge=0)
    total_amount: Decimal = Field(..., ge=0)
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    due_date: Optional[date] = None
    status: Optional[InvoiceStatus] = None
    subtotal: Optional[Decimal] = Field(None, ge=0)
    tax: Optional[Decimal] = Field(None, ge=0)
    discount: Optional[Decimal] = Field(None, ge=0)
    total_amount: Optional[Decimal] = Field(None, ge=0)
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_notes: Optional[str] = None
    notes: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: int
    invoice_code: str
    status: InvoiceStatus
    paid_amount: Decimal
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItemResponse] = []
    
    class Config:
        from_attributes = True


class InvoiceWithDetails(InvoiceResponse):
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    room_code: Optional[str] = None
    property_name: Optional[str] = None
    days_until_due: Optional[int] = None
    days_overdue: Optional[int] = None
    is_due_soon: bool = False
    is_overdue: bool = False


class PaymentRequest(BaseModel):
    payment_date: date
    payment_method: str
    payment_reference: Optional[str] = None
    payment_notes: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
