"""Contracts endpoint - with soft delete, audit log, extend and cancel"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.core.audit import create_audit_log, get_client_ip, get_user_agent, model_to_dict
from app.models import Contract, Room, Tenant, Property, Invoice
from app.models.contract import ContractStatus, PaymentCycle
from app.models.room import RoomStatus
from app.models.invoice import InvoiceStatus
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse, ContractWithDetails
from app.schemas.common import PaginatedResponse, MessageResponse
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaginatedResponse[ContractWithDetails])
def list_contracts(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[ContractStatus] = None,
    tenant_id: Optional[int] = None,
    room_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """List all contracts (non-deleted only) with details"""
    query = db.query(
        Contract,
        Tenant.full_name.label("tenant_name"),
        Tenant.phone.label("tenant_phone"),
        Room.room_code.label("room_code"),
        Room.room_name.label("room_name"),
        Property.name.label("property_name")
    ).join(Tenant).join(Room).join(Property).filter(
        Contract.is_deleted == False
    )
    
    # Apply filters
    if status:
        query = query.filter(Contract.status == status)
    if tenant_id:
        query = query.filter(Contract.tenant_id == tenant_id)
    if room_id:
        query = query.filter(Contract.room_id == room_id)
    
    total = query.count()
    results = query.offset(skip).limit(limit).all()
    
    # Build response with details
    items = []
    for contract, tenant_name, tenant_phone, room_code, room_name, property_name in results:
        days_until_expiry = (contract.end_date - date.today()).days if contract.end_date else None
        item = ContractWithDetails(
            **{c.name: getattr(contract, c.name) for c in contract.__table__.columns},
            tenant_name=tenant_name,
            tenant_phone=tenant_phone,
            room_code=room_code,
            room_name=room_name,
            property_name=property_name,
            days_until_expiry=days_until_expiry,
            is_expiring_soon=(days_until_expiry is not None and 0 <= days_until_expiry <= 30)
        )
        items.append(item)
    
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}


@router.post("", response_model=ContractResponse)
def create_contract(
    data: ContractCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create new contract with validation"""
    
    # Validate room exists and not deleted
    room = db.query(Room).filter(
        Room.id == data.room_id,
        Room.is_deleted == False
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Validate room is available
    if room.status != RoomStatus.AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail=f"Room is not available. Current status: {room.status.value}"
        )
    
    # Validate tenant exists and not deleted
    tenant = db.query(Tenant).filter(
        Tenant.id == data.tenant_id,
        Tenant.is_deleted == False
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Validate dates
    if data.start_date >= data.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )
    
    # Check for overlapping active contracts on same room
    overlapping = db.query(Contract).filter(
        Contract.room_id == data.room_id,
        Contract.status.in_([ContractStatus.ACTIVE, ContractStatus.DRAFT]),
        Contract.is_deleted == False,
        Contract.start_date <= data.end_date,
        Contract.end_date >= data.start_date
    ).first()
    
    if overlapping:
        raise HTTPException(
            status_code=400,
            detail=f"Room already has an active contract (#{overlapping.contract_code})"
        )
    
    # Generate contract code
    contract_code = f"CT{datetime.now().year}{datetime.now().month:02d}{db.query(Contract).count() + 1:04d}"
    
    # Create contract
    contract = Contract(**data.dict(), contract_code=contract_code)
    db.add(contract)
    
    # Update room status if contract is ACTIVE
    if contract.status == ContractStatus.ACTIVE:
        room.status = RoomStatus.OCCUPIED
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="contract",
        entity_id=contract.id,
        description=f"Created contract {contract.contract_code} for room {room.room_code}",
        new_value=model_to_dict(contract),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(contract)
    return contract


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get contract by ID"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.is_deleted == False
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    data: ContractUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update contract"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.is_deleted == False
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Save old values for audit
    old_value = model_to_dict(contract)
    old_status = contract.status
    
    # Validate dates if being updated
    new_end_date = data.end_date if data.end_date else contract.end_date
    if contract.start_date >= new_end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )
    
    # Update fields
    for field, value in data.dict(exclude_unset=True).items():
        setattr(contract, field, value)
    
    # Update room status if status changed
    if data.status and data.status != old_status:
        room = db.query(Room).filter(Room.id == contract.room_id).first()
        if data.status == ContractStatus.ACTIVE:
            room.status = RoomStatus.OCCUPIED
        elif data.status in [ContractStatus.EXPIRED, ContractStatus.CANCELLED]:
            room.status = RoomStatus.AVAILABLE
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="contract",
        entity_id=contract.id,
        description=f"Updated contract {contract.contract_code}",
        old_value=old_value,
        new_value=model_to_dict(contract),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Soft delete contract with validation"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.is_deleted == False
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Validation: Check for unpaid invoices
    unpaid_invoices = db.query(Invoice).filter(
        Invoice.contract_id == contract_id,
        Invoice.status.in_([InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE]),
        Invoice.is_deleted == False
    ).count()
    
    if unpaid_invoices > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete contract. There are {unpaid_invoices} unpaid invoice(s). Please settle all invoices first."
        )
    
    # Soft delete
    old_value = model_to_dict(contract)
    contract.is_deleted = True
    contract.deleted_at = datetime.utcnow()
    contract.deleted_by_id = current_user.id
    
    # Update room status if contract was active
    if contract.status == ContractStatus.ACTIVE:
        room = db.query(Room).filter(Room.id == contract.room_id).first()
        if room:
            room.status = RoomStatus.AVAILABLE
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="contract",
        entity_id=contract.id,
        description=f"Deleted contract {contract.contract_code}",
        old_value=old_value,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    return {"message": "Contract deleted successfully"}


@router.post("/{contract_id}/extend")
def extend_contract(
    contract_id: int,
    months: int = Body(..., ge=1, le=36, embed=True),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Extend contract by specified months"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.is_deleted == False
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Validation: Can only extend ACTIVE or DRAFT contracts
    if contract.status not in [ContractStatus.ACTIVE, ContractStatus.DRAFT]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot extend contract with status: {contract.status.value}. Only ACTIVE or DRAFT contracts can be extended."
        )
    
    # Save old values
    old_value = model_to_dict(contract)
    old_end_date = contract.end_date
    
    # Calculate new end date
    new_end_date = contract.end_date + timedelta(days=months * 30)
    contract.end_date = new_end_date
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="EXTEND_CONTRACT",
        entity_type="contract",
        entity_id=contract.id,
        description=f"Extended contract {contract.contract_code} by {months} month(s) from {old_end_date} to {new_end_date}",
        old_value=old_value,
        new_value=model_to_dict(contract),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(contract)
    
    return {
        "message": f"Contract extended by {months} month(s)",
        "old_end_date": old_end_date.isoformat(),
        "new_end_date": new_end_date.isoformat(),
        "contract": contract
    }


@router.post("/{contract_id}/cancel")
def cancel_contract(
    contract_id: int,
    reason: str = Body(..., min_length=1, max_length=500, embed=True),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Cancel contract with reason"""
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.is_deleted == False
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Validation: Can only cancel ACTIVE or DRAFT contracts
    if contract.status not in [ContractStatus.ACTIVE, ContractStatus.DRAFT]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel contract with status: {contract.status.value}. Only ACTIVE or DRAFT contracts can be cancelled."
        )
    
    # Save old values
    old_value = model_to_dict(contract)
    old_status = contract.status
    
    # Update status
    contract.status = ContractStatus.CANCELLED
    contract.notes = f"{contract.notes or ''}\n\n[CANCELLED] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}: {reason}".strip()
    
    # Update room status
    room = db.query(Room).filter(Room.id == contract.room_id).first()
    if room:
        room.status = RoomStatus.AVAILABLE
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CANCEL_CONTRACT",
        entity_type="contract",
        entity_id=contract.id,
        description=f"Cancelled contract {contract.contract_code}. Reason: {reason}",
        old_value=old_value,
        new_value=model_to_dict(contract),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(contract)
    
    return {
        "message": "Contract cancelled successfully",
        "contract": contract
    }
