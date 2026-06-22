from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from app.models.maintenance import MaintenanceStatus


class MaintenanceRequestBase(BaseModel):
    room_id: int
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    category: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    estimated_cost: Optional[Decimal] = Field(None, ge=0)
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class MaintenanceRequestCreate(MaintenanceRequestBase):
    pass


class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    status: Optional[MaintenanceStatus] = None
    estimated_cost: Optional[Decimal] = Field(None, ge=0)
    actual_cost: Optional[Decimal] = Field(None, ge=0)
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    resolution_notes: Optional[str] = None


class MaintenanceRequestResponse(MaintenanceRequestBase):
    id: int
    status: MaintenanceStatus
    actual_cost: Optional[Decimal] = None
    reported_date: datetime
    started_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MaintenanceRequestWithDetails(MaintenanceRequestResponse):
    room_code: Optional[str] = None
    room_name: Optional[str] = None
    property_name: Optional[str] = None
