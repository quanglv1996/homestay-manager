from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class RoomStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"


class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="SET NULL"), nullable=True)
    
    room_code = Column(String(50), nullable=False, index=True)
    room_name = Column(String(255), nullable=False)
    area = Column(Numeric(10, 2))  # in square meters
    capacity = Column(Integer, default=1)  # Max number of people
    
    # Pricing
    rent_price = Column(Numeric(10, 2), nullable=False)
    electricity_price = Column(Numeric(10, 2))
    water_price = Column(Numeric(10, 2))
    internet_fee = Column(Numeric(10, 2))
    cleaning_fee = Column(Numeric(10, 2))
    parking_fee = Column(Numeric(10, 2))
    other_fees = Column(Numeric(10, 2), default=0)
    
    # Status
    status = Column(SQLEnum(RoomStatus), default=RoomStatus.AVAILABLE, nullable=False)
    is_dormitory = Column(Boolean, default=False)
    
    description = Column(Text)
    amenities = Column(Text)  # JSON string
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft Delete fields
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    property = relationship("Property", back_populates="rooms")
    floor = relationship("Floor", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="room")
    meter_readings = relationship("MeterReading", back_populates="room", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="room", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="room", cascade="all, delete-orphan")


class Bed(Base):
    __tablename__ = "beds"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    bed_code = Column(String(50), nullable=False, index=True)
    bed_name = Column(String(100), nullable=False)
    is_occupied = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="beds")
    contracts = relationship("Contract", back_populates="bed")
