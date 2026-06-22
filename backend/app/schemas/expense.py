from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.expense import ExpenseCategory


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: ExpenseCategory
    amount: Decimal = Field(..., gt=0)
    expense_date: date
    vendor: Optional[str] = None
    receipt_number: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[ExpenseCategory] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    expense_date: Optional[date] = None
    vendor: Optional[str] = None
    receipt_number: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
