"""
File upload endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.deps import get_db, get_current_user
from app.core.audit import create_audit_log, get_client_ip, get_user_agent
from app.core.upload import (
    save_upload_file, 
    delete_file, 
    resize_image, 
    UPLOAD_DIR,
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_DOCUMENT_EXTENSIONS
)
from app.models.user import User
from app.models.attachment import Attachment, AttachmentType

router = APIRouter()


@router.post("/upload")
async def upload_files(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request,
    files: List[UploadFile] = File(...),
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    attachment_type: AttachmentType = Form(AttachmentType.DOCUMENT),
    description: Optional[str] = Form(None),
    resize_images: bool = Form(True),
):
    """
    Upload one or multiple files
    
    Args:
        files: List of files to upload
        entity_type: Type of entity (property, room, tenant, contract, maintenance, expense)
        entity_id: ID of entity
        attachment_type: Type of attachment (IMAGE, DOCUMENT, etc.)
        description: Optional description
        resize_images: Whether to resize images (default: True)
    
    Returns:
        List of created attachment records
    
    Example:
        POST /api/v1/upload
        Form data:
            files: [file1.jpg, file2.pdf]
            entity_type: tenant
            entity_id: 123
            attachment_type: IMAGE
            description: CCCD front and back
    """
    # Validate entity type
    valid_entity_types = ["property", "room", "tenant", "contract", "maintenance", "expense"]
    if entity_type not in valid_entity_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid entity_type. Must be one of: {', '.join(valid_entity_types)}"
        )
    
    # Verify entity exists
    from app.models import Property, Room, Tenant, Contract, MaintenanceRequest, Expense
    
    entity_models = {
        "property": Property,
        "room": Room,
        "tenant": Tenant,
        "contract": Contract,
        "maintenance": MaintenanceRequest,
        "expense": Expense,
    }
    
    entity_model = entity_models[entity_type]
    entity = db.query(entity_model).filter(entity_model.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"{entity_type.capitalize()} not found")
    
    # Upload files
    uploaded_attachments = []
    
    for file in files:
        # Determine if image validation needed
        validate_as_image = attachment_type == AttachmentType.IMAGE
        
        # Save file
        file_metadata = await save_upload_file(
            file=file,
            entity_type=entity_type,
            entity_id=entity_id,
            validate_as_image=validate_as_image
        )
        
        # Resize image if requested
        if resize_images and attachment_type == AttachmentType.IMAGE:
            full_path = UPLOAD_DIR / file_metadata["path"]
            resize_image(full_path)
        
        # Create attachment record
        attachment_data = {
            "filename": file_metadata["filename"],
            "original_filename": file_metadata["original_filename"],
            "file_path": file_metadata["path"],
            "file_size": file_metadata["size"],
            "file_hash": file_metadata["hash"],
            "mime_type": file_metadata["mime_type"],
            "type": attachment_type,
            "description": description,
            "uploaded_by_id": current_user.id,
        }
        
        # Set foreign key based on entity type
        attachment_data[f"{entity_type}_id"] = entity_id
        
        attachment = Attachment(**attachment_data)
        db.add(attachment)
        db.flush()
        
        uploaded_attachments.append(attachment)
    
    db.commit()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="attachment",
        entity_id=uploaded_attachments[0].id if uploaded_attachments else None,
        description=f"Uploaded {len(files)} file(s) to {entity_type} {entity_id}",
        new_value={
            "entity_type": entity_type,
            "entity_id": entity_id,
            "file_count": len(files),
            "files": [f["original_filename"] for f in [
                {"original_filename": a.original_filename} for a in uploaded_attachments
            ]]
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return uploaded_attachments


@router.get("/attachments")
def list_attachments(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    attachment_type: Optional[AttachmentType] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """
    List attachments with filtering
    
    Query params:
        entity_type: Filter by entity type
        entity_id: Filter by entity ID
        attachment_type: Filter by attachment type
    """
    query = db.query(Attachment)
    
    # Apply filters
    if entity_type and entity_id:
        filter_field = f"{entity_type}_id"
        if hasattr(Attachment, filter_field):
            query = query.filter(getattr(Attachment, filter_field) == entity_id)
    
    if attachment_type:
        query = query.filter(Attachment.type == attachment_type)
    
    total = query.count()
    items = query.order_by(Attachment.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/attachments/{attachment_id}")
def get_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get attachment metadata by ID"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return attachment


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Download attachment file
    
    Returns the actual file content
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Get full path
    file_path = UPLOAD_DIR / attachment.file_path
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=str(file_path),
        filename=attachment.original_filename,
        media_type=attachment.mime_type or "application/octet-stream"
    )


@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete attachment
    
    Removes file from disk and database record
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Delete file from disk
    file_deleted = delete_file(attachment.file_path)
    
    # Delete database record
    db.delete(attachment)
    db.commit()
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="attachment",
        entity_id=attachment_id,
        description=f"Deleted attachment {attachment.original_filename}",
        old_value={
            "filename": attachment.filename,
            "original_filename": attachment.original_filename,
            "file_path": attachment.file_path,
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {
        "message": "Attachment deleted successfully",
        "file_deleted_from_disk": file_deleted
    }


@router.get("/upload/config")
def get_upload_config():
    """
    Get upload configuration
    
    Returns allowed file types, max size, etc.
    """
    return {
        "max_file_size_mb": 10,
        "allowed_image_extensions": list(ALLOWED_IMAGE_EXTENSIONS),
        "allowed_document_extensions": list(ALLOWED_DOCUMENT_EXTENSIONS),
        "entity_types": ["property", "room", "tenant", "contract", "maintenance", "expense"],
        "attachment_types": [t.value for t in AttachmentType],
    }
