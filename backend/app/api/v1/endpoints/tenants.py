"""Tenants endpoint - with transfer room and checkout"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.core.audit import create_audit_log, get_client_ip, get_user_agent, model_to_dict
from app.models import Tenant, Contract, Room, Invoice
from app.models.invoice import InvoiceItem
from app.models.contract import ContractStatus, PaymentCycle
from app.models.room import RoomStatus
from app.models.invoice import InvoiceStatus
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.models.user import User
from pydantic import BaseModel, Field

router = APIRouter()


class TransferRoomRequest(BaseModel):
    new_room_id: int
    transfer_date: date
    reason: str = Field(..., min_length=1, max_length=500)


class CheckoutRequest(BaseModel):
    checkout_date: date
    reason: str = Field(..., min_length=1, max_length=500)
    final_electricity: Optional[Decimal] = None
    final_water: Optional[Decimal] = None


@router.get("", response_model=PaginatedResponse[TenantResponse])
def list_tenants(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Tenant).filter(Tenant.is_deleted == False)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}


@router.post("", response_model=TenantResponse)
def create_tenant(
    data: TenantCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    tenant = Tenant(**data.dict())
    db.add(tenant)
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="tenant",
        entity_id=tenant.id,
        description=f"Created tenant {tenant.full_name}",
        new_value=model_to_dict(tenant),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id,
        Tenant.is_deleted == False
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: int,
    data: TenantUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id,
        Tenant.is_deleted == False
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    old_value = model_to_dict(tenant)
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(tenant, field, value)
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="tenant",
        entity_id=tenant.id,
        description=f"Updated tenant {tenant.full_name}",
        old_value=old_value,
        new_value=model_to_dict(tenant),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id,
        Tenant.is_deleted == False
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Validation: Check for active contracts
    active_contracts = db.query(Contract).filter(
        Contract.tenant_id == tenant_id,
        Contract.status == ContractStatus.ACTIVE,
        Contract.is_deleted == False
    ).count()
    
    if active_contracts > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete tenant. There are {active_contracts} active contract(s). Please terminate contracts first."
        )
    
    old_value = model_to_dict(tenant)
    tenant.is_deleted = True
    tenant.deleted_at = datetime.utcnow()
    tenant.deleted_by_id = current_user.id
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="tenant",
        entity_id=tenant.id,
        description=f"Deleted tenant {tenant.full_name}",
        old_value=old_value,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    return {"message": "Tenant deleted successfully"}


@router.post("/{tenant_id}/transfer-room")
def transfer_room(
    tenant_id: int,
    data: TransferRoomRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """
    Transfer tenant to a new room
    - Closes old contract (set end_date to transfer_date)
    - Creates new contract for new room
    - Updates room statuses
    """
    # Validate tenant
    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id,
        Tenant.is_deleted == False
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Find active contract
    old_contract = db.query(Contract).filter(
        Contract.tenant_id == tenant_id,
        Contract.status == ContractStatus.ACTIVE,
        Contract.is_deleted == False
    ).first()
    
    if not old_contract:
        raise HTTPException(
            status_code=400,
            detail="Tenant has no active contract to transfer from"
        )
    
    # Validate new room
    new_room = db.query(Room).filter(
        Room.id == data.new_room_id,
        Room.is_deleted == False
    ).first()
    if not new_room:
        raise HTTPException(status_code=404, detail="New room not found")
    
    if new_room.status != RoomStatus.AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail=f"New room is not available. Current status: {new_room.status.value}"
        )
    
    # Validate transfer date
    if data.transfer_date < old_contract.start_date:
        raise HTTPException(
            status_code=400,
            detail="Transfer date cannot be before current contract start date"
        )
    
    # Get old room
    old_room = db.query(Room).filter(Room.id == old_contract.room_id).first()
    
    # Close old contract
    old_contract_old_value = model_to_dict(old_contract)
    old_contract.end_date = data.transfer_date
    old_contract.status = ContractStatus.EXPIRED
    old_contract.notes = f"{old_contract.notes or ''}\n\n[TRANSFER] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}: Transferred to room {new_room.room_code}. Reason: {data.reason}".strip()
    
    # Update old room status
    if old_room:
        old_room.status = RoomStatus.AVAILABLE
    
    # Create new contract
    new_contract_code = f"CT{datetime.now().year}{datetime.now().month:02d}{db.query(Contract).count() + 1:04d}"
    new_contract = Contract(
        contract_code=new_contract_code,
        tenant_id=tenant_id,
        room_id=data.new_room_id,
        start_date=data.transfer_date,
        end_date=old_contract.end_date + timedelta(days=1),  # Extend by 1 day to maintain duration
        payment_day=old_contract.payment_day,
        payment_cycle=old_contract.payment_cycle,
        rent_amount=new_room.rent_price or old_contract.rent_amount,
        deposit_amount=0,  # No new deposit for transfer
        status=ContractStatus.ACTIVE,
        terms_and_conditions=old_contract.terms_and_conditions,
        notes=f"Transferred from room {old_room.room_code if old_room else 'N/A'}. Original contract: {old_contract.contract_code}"
    )
    db.add(new_contract)
    
    # Update new room status
    new_room.status = RoomStatus.OCCUPIED
    
    db.flush()
    
    # Audit log for transfer
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="TRANSFER_ROOM",
        entity_type="contract",
        entity_id=old_contract.id,
        description=f"Transferred tenant {tenant.full_name} from room {old_room.room_code if old_room else 'N/A'} to {new_room.room_code}. Reason: {data.reason}",
        old_value=old_contract_old_value,
        new_value={
            "old_contract": model_to_dict(old_contract),
            "new_contract": model_to_dict(new_contract)
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    db.refresh(new_contract)
    
    return {
        "message": "Room transfer completed successfully",
        "old_contract_code": old_contract.contract_code,
        "new_contract_code": new_contract.contract_code,
        "old_room": old_room.room_code if old_room else None,
        "new_room": new_room.room_code,
        "transfer_date": data.transfer_date.isoformat()
    }


@router.post("/{tenant_id}/checkout")
def checkout(
    tenant_id: int,
    data: CheckoutRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """
    Checkout tenant from room
    - Closes active contract
    - Updates room status to available
    - Creates final invoice with meter readings
    """
    # Validate tenant
    tenant = db.query(Tenant).filter(
        Tenant.id == tenant_id,
        Tenant.is_deleted == False
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Find active contract
    contract = db.query(Contract).filter(
        Contract.tenant_id == tenant_id,
        Contract.status == ContractStatus.ACTIVE,
        Contract.is_deleted == False
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=400,
            detail="Tenant has no active contract to checkout from"
        )
    
    # Validate checkout date
    if data.checkout_date < contract.start_date:
        raise HTTPException(
            status_code=400,
            detail="Checkout date cannot be before contract start date"
        )
    
    # Get room
    room = db.query(Room).filter(Room.id == contract.room_id).first()
    
    # Close contract
    contract_old_value = model_to_dict(contract)
    contract.end_date = data.checkout_date
    contract.status = ContractStatus.EXPIRED
    contract.notes = f"{contract.notes or ''}\n\n[CHECKOUT] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}: Checked out. Reason: {data.reason}".strip()
    
    # Update room status
    if room:
        room.status = RoomStatus.AVAILABLE
    
    # Create final invoice if meter readings provided
    final_invoice = None
    if data.final_electricity is not None or data.final_water is not None:
        # Calculate invoice amounts
        electricity_amount = Decimal(0)
        water_amount = Decimal(0)
        
        if data.final_electricity and room:
            # Simple calculation - would need last meter reading for accurate calculation
            electricity_amount = data.final_electricity * Decimal(room.electricity_price or 3500)
        
        if data.final_water and room:
            water_amount = data.final_water * Decimal(room.water_price or 20000)
        
        invoice_code = f"INV{datetime.now().year}{datetime.now().month:02d}{db.query(Invoice).count() + 1:04d}"
        
        # Calculate total amount
        rent_amount = contract.rent_amount
        total_amount = rent_amount + electricity_amount + water_amount
        
        final_invoice = Invoice(
            invoice_code=invoice_code,
            contract_id=contract.id,
            period_start=contract.start_date,
            period_end=data.checkout_date,
            due_date=data.checkout_date,
            subtotal=total_amount,
            tax=Decimal(0),
            discount=Decimal(0),
            total_amount=total_amount,
            paid_amount=Decimal(0),
            status=InvoiceStatus.UNPAID,
            notes=f"Final invoice for checkout. Electricity: {data.final_electricity or 0} kWh, Water: {data.final_water or 0} m³"
        )
        db.add(final_invoice)
        db.flush()
        
        # Create invoice items
        if rent_amount > 0:
            rent_item = InvoiceItem(
                invoice_id=final_invoice.id,
                description="Rent (prorated)",
                quantity=1,
                unit_price=rent_amount,
                amount=rent_amount,
                item_type="rent"
            )
            db.add(rent_item)
        
        if electricity_amount > 0:
            electricity_item = InvoiceItem(
                invoice_id=final_invoice.id,
                description=f"Electricity ({data.final_electricity} kWh)",
                quantity=data.final_electricity,
                unit_price=Decimal(room.electricity_price or 3500),
                amount=electricity_amount,
                item_type="electricity"
            )
            db.add(electricity_item)
        
        if water_amount > 0:
            water_item = InvoiceItem(
                invoice_id=final_invoice.id,
                description=f"Water ({data.final_water} m³)",
                quantity=data.final_water,
                unit_price=Decimal(room.water_price or 20000),
                amount=water_amount,
                item_type="water"
            )
            db.add(water_item)
    
    db.flush()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CHECKOUT",
        entity_type="contract",
        entity_id=contract.id,
        description=f"Checked out tenant {tenant.full_name} from room {room.room_code if room else 'N/A'}. Reason: {data.reason}",
        old_value=contract_old_value,
        new_value=model_to_dict(contract),
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    db.commit()
    
    result = {
        "message": "Checkout completed successfully",
        "contract_code": contract.contract_code,
        "room": room.room_code if room else None,
        "checkout_date": data.checkout_date.isoformat(),
        "final_invoice": None
    }
    
    if final_invoice:
        db.refresh(final_invoice)
        result["final_invoice"] = {
            "invoice_code": final_invoice.invoice_code,
            "total_amount": float(final_invoice.total_amount),
            "items": []
        }
        
        # Add items if available
        if final_invoice.items:
            for item in final_invoice.items:
                result["final_invoice"]["items"].append({
                    "description": item.description,
                    "amount": float(item.amount)
                })
    
    return result
