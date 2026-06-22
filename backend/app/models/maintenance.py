from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class MaintenanceStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50))  # electrical, plumbing, hvac, furniture, etc.
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    
    status = Column(SQLEnum(MaintenanceStatus), default=MaintenanceStatus.PENDING, nullable=False)
    
    # Cost
    estimated_cost = Column(Numeric(10, 2))
    actual_cost = Column(Numeric(10, 2))
    
    # Dates
    reported_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_date = Column(DateTime)
    completed_date = Column(DateTime)
    
    # Assignment
    assigned_to = Column(String(255))
    
    notes = Column(Text)
    resolution_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="maintenance_requests")
    attachments = relationship("Attachment", back_populates="maintenance_request", cascade="all, delete-orphan")
