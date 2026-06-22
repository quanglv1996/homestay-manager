from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AttachmentType(str, enum.Enum):
    IMAGE = "image"
    DOCUMENT = "document"
    VIDEO = "video"
    OTHER = "other"


class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    type = Column(SQLEnum(AttachmentType), default=AttachmentType.DOCUMENT)
    
    # Foreign keys (nullable, one attachment can belong to one entity)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"))
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"))
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"))
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"))
    maintenance_request_id = Column(Integer, ForeignKey("maintenance_requests.id", ondelete="CASCADE"))
    expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="CASCADE"))
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    property = relationship("Property", back_populates="attachments")
    room = relationship("Room", back_populates="attachments")
    tenant = relationship("Tenant", back_populates="attachments")
    contract = relationship("Contract", back_populates="attachments")
    maintenance_request = relationship("MaintenanceRequest", back_populates="attachments")
    expense = relationship("Expense", back_populates="attachments")
