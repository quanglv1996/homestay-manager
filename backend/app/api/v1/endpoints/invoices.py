"""Invoices endpoint - placeholder"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.schemas.common import PaginatedResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse[InvoiceResponse])
def list_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Invoice)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}

@router.post("", response_model=InvoiceResponse)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    from datetime import datetime
    invoice_code = f"INV{datetime.now().year}{datetime.now().month:02d}{db.query(Invoice).count() + 1:04d}"
    invoice = Invoice(**data.dict(exclude={"items"}), invoice_code=invoice_code)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, data: InvoiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return invoice
