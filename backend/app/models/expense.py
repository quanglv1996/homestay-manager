from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Enum as SQLEnum, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ExpenseCategory(str, enum.Enum):
    UTILITIES = "UTILITIES"
    MAINTENANCE = "MAINTENANCE"
    SALARY = "SALARY"
    INSURANCE = "INSURANCE"
    TAX = "TAX"
    MARKETING = "MARKETING"
    SUPPLIES = "SUPPLIES"
    OTHER = "OTHER"


class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(SQLEnum(ExpenseCategory), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    
    expense_date = Column(Date, nullable=False)
    vendor = Column(String(255))
    receipt_number = Column(String(100))
    payment_method = Column(String(50))
    
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft Delete fields
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    attachments = relationship("Attachment", back_populates="expense", cascade="all, delete-orphan")
