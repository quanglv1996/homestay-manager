from datetime import datetime, date
from sqlalchemy import Column, Integer, DateTime, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class MeterReading(Base):
    __tablename__ = "meter_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    
    # Reading Period
    reading_date = Column(Date, nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    # Electricity
    electricity_previous = Column(Numeric(10, 2), default=0)
    electricity_current = Column(Numeric(10, 2), default=0)
    electricity_usage = Column(Numeric(10, 2), default=0)
    electricity_price = Column(Numeric(10, 2), default=0)
    electricity_amount = Column(Numeric(10, 2), default=0)
    electricity_image = Column(String(500))
    
    # Water
    water_previous = Column(Numeric(10, 2), default=0)
    water_current = Column(Numeric(10, 2), default=0)
    water_usage = Column(Numeric(10, 2), default=0)
    water_price = Column(Numeric(10, 2), default=0)
    water_amount = Column(Numeric(10, 2), default=0)
    water_image = Column(String(500))
    
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    room = relationship("Room", back_populates="meter_readings")
    invoice_items = relationship("InvoiceItem", back_populates="meter_reading")
