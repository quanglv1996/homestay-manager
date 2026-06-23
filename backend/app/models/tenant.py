from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    date_of_birth = Column(Date)
    
    # ID Card Information
    id_card_number = Column(String(20), unique=True, index=True)
    id_card_issue_date = Column(Date)
    id_card_issue_place = Column(String(255))
    id_card_front_image = Column(String(500))
    id_card_back_image = Column(String(500))
    
    # Contact Information
    phone = Column(String(20), nullable=False)
    email = Column(String(255))
    permanent_address = Column(Text)
    
    # Vehicle Information
    vehicle_plate = Column(String(20))
    
    # Additional Information
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(20))
    occupation = Column(String(255))
    company = Column(String(255))
    
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft Delete fields
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    contracts = relationship("Contract", back_populates="tenant")
    attachments = relationship("Attachment", back_populates="tenant", cascade="all, delete-orphan")
