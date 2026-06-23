from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class NotificationType(str, enum.Enum):
    PAYMENT_DUE = "PAYMENT_DUE"
    PAYMENT_OVERDUE = "PAYMENT_OVERDUE"
    CONTRACT_EXPIRING = "CONTRACT_EXPIRING"
    MAINTENANCE_REQUEST = "MAINTENANCE_REQUEST"
    ROOM_AVAILABLE = "ROOM_AVAILABLE"
    SYSTEM = "SYSTEM"


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Reference to related entity
    reference_type = Column(String(50))  # invoice, contract, maintenance, etc.
    reference_id = Column(Integer)
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
