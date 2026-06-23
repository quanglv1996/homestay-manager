from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class House(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Room(BaseModel):
    id: Optional[str] = None
    houseId: str
    name: str
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Bed(BaseModel):
    id: Optional[str] = None
    roomId: str
    name: str
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Contract(BaseModel):
    id: Optional[str] = None
    tenantName: str
    tenantPhone: str
    tenantEmail: Optional[str] = ""
    tenantIdCard: Optional[str] = ""
    startDate: str
    endDate: str
    price: float
    equipment: Optional[List[str]] = []
    notes: Optional[str] = ""
    status: Optional[str] = "active"
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Assignment(BaseModel):
    id: Optional[str] = None
    bedId: str
    contractId: str
    level: str  # "top" or "bottom"
    createdAt: Optional[str] = None

class DashboardStats(BaseModel):
    totalBeds: int
    availablePositions: int
    occupiedPositions: int
    paymentDueSoon: int
    contractExpiringSoon: int
