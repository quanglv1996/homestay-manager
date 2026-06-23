"""
File upload utilities and validation
"""
import os
import hashlib
import mimetypes
from typing import Optional, List
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
import io


# Configuration
UPLOAD_DIR = Path("/app/uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOCUMENT_EXTENSIONS


def get_file_extension(filename: str) -> str:
    """Get file extension in lowercase"""
    return Path(filename).suffix.lower()


def validate_file(file: UploadFile, allowed_extensions: Optional[set] = None) -> None:
    """
    Validate uploaded file
    
    Args:
        file: UploadFile instance
        allowed_extensions: Set of allowed extensions (default: ALLOWED_EXTENSIONS)
    
    Raises:
        HTTPException: If validation fails
    """
    if allowed_extensions is None:
        allowed_extensions = ALLOWED_EXTENSIONS
    
    # Check file extension
    ext = get_file_extension(file.filename)
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Check file size (read in chunks to avoid loading large files into memory)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")


def validate_image(file: UploadFile) -> None:
    """
    Validate image file and check if it's a valid image
    
    Args:
        file: UploadFile instance
    
    Raises:
        HTTPException: If validation fails
    """
    validate_file(file, ALLOWED_IMAGE_EXTENSIONS)
    
    # Try to open image to verify it's valid
    try:
        file.file.seek(0)
        image = Image.open(file.file)
        image.verify()
        file.file.seek(0)  # Reset after verify
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")


def calculate_file_hash(content: bytes) -> str:
    """Calculate SHA256 hash of file content"""
    return hashlib.sha256(content).hexdigest()


def get_upload_path(
    entity_type: str,
    entity_id: int,
    filename: str,
    create_dirs: bool = True
) -> Path:
    """
    Get upload path for file
    
    Args:
        entity_type: Type of entity (property, room, tenant, contract)
        entity_id: ID of entity
        filename: Original filename
        create_dirs: Whether to create directories if they don't exist
    
    Returns:
        Full path where file should be saved
    
    Example:
        uploads/properties/123/image_abc123.jpg
        uploads/tenants/456/id_card_front.jpg
    """
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = get_file_extension(filename)
    base_name = Path(filename).stem[:50]  # Limit base name length
    unique_filename = f"{base_name}_{timestamp}{ext}"
    
    # Build path
    upload_path = UPLOAD_DIR / entity_type / str(entity_id)
    
    if create_dirs:
        upload_path.mkdir(parents=True, exist_ok=True)
    
    return upload_path / unique_filename


async def save_upload_file(
    file: UploadFile,
    entity_type: str,
    entity_id: int,
    validate_as_image: bool = False
) -> dict:
    """
    Save uploaded file and return metadata
    
    Args:
        file: UploadFile instance
        entity_type: Type of entity
        entity_id: ID of entity
        validate_as_image: If True, validate as image
    
    Returns:
        dict with file metadata (path, size, hash, mime_type)
    
    Raises:
        HTTPException: If validation or save fails
    """
    # Validate
    if validate_as_image:
        validate_image(file)
    else:
        validate_file(file)
    
    # Read file content
    content = await file.read()
    
    # Calculate hash
    file_hash = calculate_file_hash(content)
    
    # Get save path
    save_path = get_upload_path(entity_type, entity_id, file.filename)
    
    # Save file
    try:
        with open(save_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Get mime type
    mime_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    
    # Return metadata
    return {
        "filename": save_path.name,
        "original_filename": file.filename,
        "path": str(save_path.relative_to(UPLOAD_DIR)),
        "size": len(content),
        "hash": file_hash,
        "mime_type": mime_type,
    }


def delete_file(file_path: str) -> bool:
    """
    Delete file from disk
    
    Args:
        file_path: Relative path to file (from UPLOAD_DIR)
    
    Returns:
        True if deleted, False if file doesn't exist
    """
    full_path = UPLOAD_DIR / file_path
    
    if full_path.exists():
        try:
            full_path.unlink()
            return True
        except Exception:
            return False
    
    return False


def resize_image(
    image_path: Path,
    max_width: int = 1920,
    max_height: int = 1920,
    quality: int = 85
) -> None:
    """
    Resize image if larger than max dimensions
    
    Args:
        image_path: Path to image file
        max_width: Maximum width
        max_height: Maximum height
        quality: JPEG quality (1-100)
    """
    try:
        with Image.open(image_path) as img:
            # Check if resize needed
            if img.width <= max_width and img.height <= max_height:
                return
            
            # Calculate new size maintaining aspect ratio
            ratio = min(max_width / img.width, max_height / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            
            # Resize
            img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save
            if img.format == "PNG":
                img_resized.save(image_path, "PNG", optimize=True)
            else:
                # Convert to RGB if necessary (for RGBA images)
                if img_resized.mode in ("RGBA", "LA", "P"):
                    img_resized = img_resized.convert("RGB")
                img_resized.save(image_path, "JPEG", quality=quality, optimize=True)
    except Exception as e:
        # If resize fails, keep original
        print(f"Failed to resize image {image_path}: {e}")
