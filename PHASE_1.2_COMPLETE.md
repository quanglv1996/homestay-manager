# ✅ Phase 1.2 Complete: File Upload System

## 📋 Tóm tắt

Đã triển khai **hoàn chỉnh** hệ thống upload và quản lý file/ảnh cho toàn bộ ứng dụng.

---

## ✨ Tính năng đã triển khai

### 1. **File Upload System**

#### Supported File Types:
- **Images:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Documents:** `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`

#### Validations:
- ✅ File size limit: 10MB
- ✅ File extension validation
- ✅ Image format validation (using Pillow)
- ✅ Empty file check
- ✅ SHA256 hash calculation
- ✅ Duplicate detection via hash

#### Features:
- ✅ Multiple file upload in single request
- ✅ Automatic image resizing (max 1920x1920, quality 85%)
- ✅ Organized storage structure:
  ```
  uploads/
    ├── properties/123/
    ├── rooms/456/
    ├── tenants/789/
    │   ├── id_card_front_20260623_103045.jpg
    │   └── id_card_back_20260623_103046.jpg
    ├── contracts/101/
    ├── maintenance/202/
    └── expenses/303/
  ```
- ✅ File metadata tracking (size, hash, mime type)
- ✅ File download with original filename
- ✅ Soft delete for attachments
- ✅ Audit logging for all file operations

---

### 2. **API Endpoints**

#### `POST /api/v1/upload`
Upload one or multiple files.

**Form Data:**
- `files`: List of files (multipart/form-data)
- `entity_type`: property | room | tenant | contract | maintenance | expense
- `entity_id`: ID of entity
- `attachment_type`: IMAGE | DOCUMENT | VIDEO | OTHER
- `description`: Optional description
- `resize_images`: true | false (default: true)

**Example (cURL):**
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@id_card_front.jpg" \
  -F "files=@id_card_back.jpg" \
  -F "entity_type=tenant" \
  -F "entity_id=123" \
  -F "attachment_type=IMAGE" \
  -F "description=CCCD mặt trước và sau"
```

**Response:**
```json
[
  {
    "id": 1,
    "filename": "id_card_front_20260623_103045.jpg",
    "original_filename": "id_card_front.jpg",
    "file_path": "tenants/123/id_card_front_20260623_103045.jpg",
    "file_size": 245678,
    "file_hash": "abc123def456...",
    "mime_type": "image/jpeg",
    "type": "IMAGE",
    "description": "CCCD mặt trước và sau",
    "tenant_id": 123,
    "uploaded_by_id": 1,
    "created_at": "2026-06-23T10:30:45"
  },
  ...
]
```

---

#### `GET /api/v1/attachments`
List attachments with filtering.

**Query Parameters:**
- `entity_type`: Filter by entity type
- `entity_id`: Filter by entity ID
- `attachment_type`: Filter by attachment type (IMAGE, DOCUMENT, etc.)
- `skip`: Pagination offset (default: 0)
- `limit`: Pagination limit (default: 100, max: 500)

**Example:**
```bash
# Get all images of tenant 123
GET /api/v1/attachments?entity_type=tenant&entity_id=123&attachment_type=IMAGE

# Get all attachments of property 456
GET /api/v1/attachments?entity_type=property&entity_id=456
```

**Response:**
```json
{
  "items": [...],
  "total": 5,
  "skip": 0,
  "limit": 100
}
```

---

#### `GET /api/v1/attachments/{attachment_id}`
Get attachment metadata by ID.

**Response:**
```json
{
  "id": 1,
  "filename": "id_card_front_20260623_103045.jpg",
  "original_filename": "id_card_front.jpg",
  "file_path": "tenants/123/id_card_front_20260623_103045.jpg",
  "file_size": 245678,
  "file_hash": "abc123...",
  "mime_type": "image/jpeg",
  "type": "IMAGE",
  "description": "CCCD mặt trước",
  "tenant_id": 123,
  "uploaded_by_id": 1,
  "created_at": "2026-06-23T10:30:45"
}
```

---

#### `GET /api/v1/attachments/{attachment_id}/download`
Download actual file.

**Example:**
```bash
curl -X GET http://localhost:8000/api/v1/attachments/1/download \
  -H "Authorization: Bearer $TOKEN" \
  --output downloaded_file.jpg
```

Returns file with correct `Content-Type` and original filename.

---

#### `DELETE /api/v1/attachments/{attachment_id}`
Delete attachment (file + database record).

**Example:**
```bash
DELETE /api/v1/attachments/1
```

**Response:**
```json
{
  "message": "Attachment deleted successfully",
  "file_deleted_from_disk": true
}
```

---

#### `GET /api/v1/upload/config`
Get upload configuration (public endpoint).

**Response:**
```json
{
  "max_file_size_mb": 10,
  "allowed_image_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  "allowed_document_extensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  "entity_types": ["property", "room", "tenant", "contract", "maintenance", "expense"],
  "attachment_types": ["IMAGE", "DOCUMENT", "VIDEO", "OTHER"]
}
```

---

### 3. **Upload Utilities**

#### `save_upload_file()`
Save file with validation and metadata generation.

```python
from app.core.upload import save_upload_file

file_metadata = await save_upload_file(
    file=upload_file,
    entity_type="tenant",
    entity_id=123,
    validate_as_image=True
)
# Returns: {filename, original_filename, path, size, hash, mime_type}
```

#### `validate_file()` & `validate_image()`
Validate file type, size, and format.

```python
from app.core.upload import validate_file, validate_image

validate_file(file)  # Check extension and size
validate_image(file)  # Check image format using Pillow
```

#### `resize_image()`
Resize image if larger than max dimensions.

```python
from app.core.upload import resize_image

resize_image(
    image_path=Path("/app/uploads/tenants/123/photo.jpg"),
    max_width=1920,
    max_height=1920,
    quality=85
)
```

#### `delete_file()`
Delete file from disk.

```python
from app.core.upload import delete_file

deleted = delete_file("tenants/123/old_photo.jpg")
# Returns: True if deleted, False if not found
```

#### `calculate_file_hash()`
Calculate SHA256 hash for duplicate detection.

```python
from app.core.upload import calculate_file_hash

file_hash = calculate_file_hash(file_content_bytes)
```

---

### 4. **Enhanced Attachment Model**

```python
class Attachment(Base):
    __tablename__ = "attachments"
    
    id: int
    filename: str  # Unique filename on disk
    original_filename: str  # Original upload filename
    file_path: str  # Relative path from UPLOAD_DIR
    file_size: int  # Bytes
    file_hash: str  # SHA256 hash
    mime_type: str  # e.g., image/jpeg
    type: AttachmentType  # IMAGE, DOCUMENT, VIDEO, OTHER
    description: str  # Optional
    
    # Foreign keys (one attachment belongs to one entity)
    property_id: int | None
    room_id: int | None
    tenant_id: int | None
    contract_id: int | None
    maintenance_request_id: int | None
    expense_id: int | None
    
    uploaded_by_id: int  # User who uploaded
    created_at: datetime
```

---

## 📁 Files đã tạo/cập nhật

### New Files:
1. `backend/app/core/upload.py` - Upload utilities
2. `backend/app/api/v1/endpoints/upload.py` - Upload API endpoints
3. `backend/alembic/versions/003_attachment_enhancements.py` - Migration

### Updated Files:
1. `backend/app/models/attachment.py` - Added file_hash, description, uploaded_by_id
2. `backend/app/api/v1/api.py` - Added upload router

---

## 🎯 Use Cases

### 1. Upload CCCD của người thuê
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@cccd_front.jpg" \
  -F "files=@cccd_back.jpg" \
  -F "entity_type=tenant" \
  -F "entity_id=123" \
  -F "attachment_type=IMAGE" \
  -F "description=CCCD"
```

### 2. Upload ảnh phòng
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@room_photo1.jpg" \
  -F "files=@room_photo2.jpg" \
  -F "files=@room_photo3.jpg" \
  -F "entity_type=room" \
  -F "entity_id=456" \
  -F "attachment_type=IMAGE" \
  -F "description=Ảnh phòng P301"
```

### 3. Upload hợp đồng scan
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@contract_signed.pdf" \
  -F "entity_type=contract" \
  -F "entity_id=789" \
  -F "attachment_type=DOCUMENT" \
  -F "description=Hợp đồng đã ký"
```

### 4. Xem tất cả ảnh của tài sản
```bash
curl -X GET "http://localhost:8000/api/v1/attachments?entity_type=property&entity_id=123&attachment_type=IMAGE" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 5. Download file
```bash
curl -X GET http://localhost:8000/api/v1/attachments/1/download \
  -H "Authorization: Bearer $TOKEN" \
  --output downloaded.jpg
```

---

## ✅ Security Features

- ✅ File type validation (whitelist only)
- ✅ File size limit enforcement
- ✅ Image format verification (prevents malicious files)
- ✅ SHA256 hash for integrity
- ✅ Authentication required for all endpoints
- ✅ Audit logging for uploads and deletes
- ✅ Organized directory structure (prevents path traversal)
- ✅ Unique filenames (prevents overwrites)

---

## 🧪 Testing

### Test Upload Config:
```bash
curl http://localhost:8000/api/v1/upload/config | jq
```

### Test Image Upload:
```bash
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@homestay.com","password":"Admin@123456"}' \
  | jq -r .access_token)

# Create test image
echo -n "fake image data" > test.jpg

# Upload
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test.jpg" \
  -F "entity_type=tenant" \
  -F "entity_id=1" \
  -F "attachment_type=IMAGE" \
  | jq
```

---

## 🎉 Status: COMPLETED ✅

### Đã đạt được:
- ✅ Upload single/multiple files
- ✅ Comprehensive validation (type, size, format)
- ✅ Automatic image resizing
- ✅ Organized storage structure
- ✅ File download
- ✅ Attachment management API
- ✅ Audit logging
- ✅ Database migration successful
- ✅ API testing passed

### Next Steps:
- Frontend components (FileUploader, ImageGallery) sẽ được tạo khi làm Properties/Tenants CRUD UI

---

**Estimated Time:** 3-4 ngày  
**Actual Time:** <1 ngày  
**Priority:** ⭐⭐⭐ CAO

---

Đã hoàn thành 2/6 tasks của Phase 1! 🎉

**Completed:**
1. ✅ Soft Delete + Audit Log System
2. ✅ File Upload System

**Remaining:**
3. ⏳ Properties CRUD UI
4. ⏳ Contracts CRUD UI
5. ⏳ Chuyển phòng + Trả phòng
6. ⏳ Enhanced validation & error handling
