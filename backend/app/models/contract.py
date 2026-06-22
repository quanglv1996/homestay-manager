from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Enum as SQLEnum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class PaymentCycle(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_code = Column(String(50), unique=True, nullable=False, index=True)
    
    # References
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.id", ondelete="SET NULL"), nullable=True)
    
    # Contract Details
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    payment_day = Column(Integer, nullable=False)  # Day of month (1-31)
    payment_cycle = Column(SQLEnum(PaymentCycle), default=PaymentCycle.MONTHLY, nullable=False)
    
    # Financial
    rent_amount = Column(Numeric(10, 2), nullable=False)
    deposit_amount = Column(Numeric(10, 2), default=0)
    
    # Additional Terms
    terms_and_conditions = Column(Text)
    notes = Column(Text)
    
    # Status
    status = Column(SQLEnum(ContractStatus), default=ContractStatus.DRAFT, nullable=False)
    
    # Signatures
    signed_date = Column(Date)
    landlord_signature = Column(String(500))
    tenant_signature = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="contracts")
    room = relationship("Room", back_populates="contracts")
    bed = relationship("Bed", back_populates="contracts")
    invoices = relationship("Invoice", back_populates="contract", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="contract", cascade="all, delete-orphan")
