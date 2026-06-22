"""Dashboard endpoint"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.core.deps import get_current_user
from app.models import Property, Room, Tenant, Contract, Invoice, RoomStatus, ContractStatus, InvoiceStatus
from app.models.user import User
from datetime import date, timedelta
from decimal import Decimal

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    total_properties = db.query(Property).count()
    total_rooms = db.query(Room).count()
    occupied_rooms = db.query(Room).filter(Room.status == RoomStatus.OCCUPIED).count()
    available_rooms = db.query(Room).filter(Room.status == RoomStatus.AVAILABLE).count()
    total_tenants = db.query(Tenant).count()
    active_contracts = db.query(Contract).filter(Contract.status == ContractStatus.ACTIVE).count()
    
    # Revenue calculations
    today = date.today()
    month_start = today.replace(day=1)
    
    revenue_this_month = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.status == InvoiceStatus.PAID,
        Invoice.payment_date >= month_start
    ).scalar() or Decimal(0)
    
    unpaid_invoices = db.query(func.count(Invoice.id)).filter(
        Invoice.status == InvoiceStatus.UNPAID
    ).scalar() or 0
    
    overdue_invoices = db.query(func.count(Invoice.id)).filter(
        Invoice.status == InvoiceStatus.OVERDUE
    ).scalar() or 0
    
    # Expiring contracts (within 30 days)
    expiring_contracts = db.query(func.count(Contract.id)).filter(
        Contract.status == ContractStatus.ACTIVE,
        Contract.end_date <= today + timedelta(days=30),
        Contract.end_date >= today
    ).scalar() or 0
    
    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    return {
        "total_properties": total_properties,
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "available_rooms": available_rooms,
        "occupancy_rate": round(occupancy_rate, 2),
        "total_tenants": total_tenants,
        "active_contracts": active_contracts,
        "revenue_this_month": float(revenue_this_month),
        "unpaid_invoices": unpaid_invoices,
        "overdue_invoices": overdue_invoices,
        "expiring_contracts": expiring_contracts
    }
