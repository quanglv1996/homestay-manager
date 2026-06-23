from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AuditAction(str, enum.Enum):
    """Audit action types"""
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    RESTORE = "RESTORE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    CHANGE_PASSWORD = "CHANGE_PASSWORD"
    TRANSFER_ROOM = "TRANSFER_ROOM"
    CHECKOUT = "CHECKOUT"
    EXTEND_CONTRACT = "EXTEND_CONTRACT"
    CANCEL_CONTRACT = "CANCEL_CONTRACT"
    PAY_INVOICE = "PAY_INVOICE"


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type = Column(String(50), index=True)  # property, room, tenant, contract, etc.
    entity_id = Column(Integer, index=True)
    
    description = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    
    # Store the old and new values separately for better tracking
    old_value = Column(JSON)  # Value before change
    new_value = Column(JSON)  # Value after change
    changes = Column(JSON)    # Detailed changes (for backward compatibility)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
