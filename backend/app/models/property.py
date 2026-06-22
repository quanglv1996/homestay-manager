from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PropertyType(str, enum.Enum):
    MINI_APARTMENT = "mini_apartment"
    ROOM_RENTAL = "room_rental"
    DORMITORY = "dormitory"


class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(SQLEnum(PropertyType), nullable=False)
    address = Column(Text, nullable=False)
    description = Column(Text)
    total_floors = Column(Integer, default=0)
    total_rooms = Column(Integer, default=0)
    
    # Contact Information
    contact_name = Column(String(255))
    contact_phone = Column(String(20))
    contact_email = Column(String(255))
    
    # Default pricing (can be overridden per room)
    default_electricity_price = Column(Numeric(10, 2), default=0)
    default_water_price = Column(Numeric(10, 2), default=0)
    default_internet_fee = Column(Numeric(10, 2), default=0)
    default_cleaning_fee = Column(Numeric(10, 2), default=0)
    default_parking_fee = Column(Numeric(10, 2), default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    floors = relationship("Floor", back_populates="property", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="property", cascade="all, delete-orphan")


class Floor(Base):
    __tablename__ = "floors"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    floor_number = Column(Integer, nullable=False)
    floor_name = Column(String(100), nullable=False)
    description = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    property = relationship("Property", back_populates="floors")
    rooms = relationship("Room", back_populates="floor", cascade="all, delete-orphan")
