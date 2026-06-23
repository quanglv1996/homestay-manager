# 🏠 Homestay Manager - Hệ thống quản lý cho thuê nhà/phòng trọ

**Version:** 1.0.0  
**Last Updated:** 2026-06-23  
**Status:** Production Ready ✅

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt & Triển khai](#-cài-đặt--triển-khai)
- [Cấu trúc Database](#-cấu-trúc-database)
- [API Documentation](#-api-documentation)
- [Tính năng chính](#-tính-năng-chính)
- [Luồng nghiệp vụ](#-luồng-nghiệp-vụ)
- [Security & Authentication](#-security--authentication)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Tổng quan

**Homestay Manager** là hệ thống quản lý toàn diện cho việc cho thuê nhà trọ, mini apartment, dormitory với đầy đủ tính năng:

### Đặc điểm nổi bật

✅ **Quản lý đa dạng loại tài sản** - Mini Apartment, Room Rental, Dormitory  
✅ **Quản lý hợp đồng thông minh** - Extend, Cancel, Transfer Room, Checkout  
✅ **Theo dõi tài chính** - Invoices, Expenses, Debt tracking  
✅ **Audit Log System** - Ghi nhận mọi thay đổi với old/new values  
✅ **Soft Delete** - Xóa mềm để đảm bảo tính toàn vẹn dữ liệu  
✅ **File Upload** - Image upload với validation và auto-resize  
✅ **Role-based Access Control** - Admin, Manager, Staff  

### Use Cases

- 🏢 **Công ty quản lý BĐS** - Quản lý nhiều tòa nhà/khu chung cư
- 🏘️ **Chủ nhà trọ** - Quản lý phòng trọ, người thuê, thu tiền
- 🏫 **Ký túc xá** - Quản lý giường, phòng, sinh viên
- 👨‍💼 **Cá nhân** - Cho thuê căn hộ/phòng ở

---

## 🏗️ Kiến trúc hệ thống

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (Port 80)                       │
│                      Reverse Proxy                           │
└───────────────┬────────────────────────┬────────────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│   Frontend (Port 3000)    │  │   Backend API (Port 8000)    │
│   React 19 + TypeScript   │  │   FastAPI + Python 3.12      │
│   Material-UI + Zustand   │  │   SQLAlchemy 2.0 ORM         │
│   Vite Build Tool         │  │   Pydantic v2 Validation     │
└───────────────────────────┘  └──────────────┬───────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │  PostgreSQL 16 (Port 5432)   │
                               │  Relational Database         │
                               │  15 Tables + 10 Enums        │
                               └──────────────────────────────┘
```

### Service Communication

```
Browser → Nginx:80 → Frontend:3000 (Static Files)
Browser → Nginx:80 → Backend:8000/api/v1/* (API Calls)
Backend → PostgreSQL:5432 (Database Queries)
Backend → /app/uploads (File Storage)
```

---

## 💻 Công nghệ sử dụng

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.12-slim | Core language |
| **FastAPI** | 0.109.2 | Web framework |
| **SQLAlchemy** | 2.0.27 | ORM |
| **Alembic** | 1.13.1 | Database migrations |
| **Pydantic** | 2.6.1 | Data validation |
| **PostgreSQL** | 16-alpine | Database |
| **python-jose** | 3.3.0 | JWT authentication |
| **passlib** | 1.7.4 | Password hashing |
| **Pillow** | 10.2.0 | Image processing |

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0.0 | UI framework |
| **TypeScript** | 5.3.3 | Type safety |
| **Material-UI** | 5.15.10 | Component library |
| **Vite** | 5.1.0 | Build tool |
| **Zustand** | 4.5.0 | State management |
| **Axios** | 1.6.7 | HTTP client |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | Latest | Containerization |
| **Docker Compose** | Latest | Orchestration |
| **Nginx** | alpine | Reverse proxy |

---

## 🚀 Cài đặt & Triển khai

### Prerequisites

- Docker & Docker Compose
- Port 80, 3000, 5432, 8000 available

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd homestay-manager

# 2. Configure environment (hoặc sử dụng .env có sẵn)
# File .env đã được cấu hình sẵn cho môi trường dev

# 3. Build and start all services
docker compose up -d --build

# 4. Wait for services to be ready (30-60 seconds)
docker compose ps

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Default Credentials

```
Email: admin@homestay.com
Password: Admin@123456
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:8000 | REST API |
| **API Documentation** | http://localhost:8000/docs | OpenAPI/Swagger UI |
| **Alternative Docs** | http://localhost:8000/redoc | ReDoc UI |
| **Nginx** | http://localhost:80 | Reverse proxy |

---

## 🗄️ Cấu trúc Database

### Database Schema Overview

**Total:** 15 tables, 10 enums, 50+ relationships

### Core Tables

#### 1. Users (Người dùng)
```sql
users (
  id: Primary Key
  email: Unique, Not Null
  hashed_password: Not Null
  full_name: Not Null
  role: Enum (ADMIN, MANAGER, STAFF)
  is_active: Boolean, Default True
  last_login: DateTime
  created_at: DateTime
)
```

#### 2. Properties (Tài sản)
```sql
properties (
  id: Primary Key
  name: Not Null
  type: Enum (MINI_APARTMENT, ROOM_RENTAL, DORMITORY)
  address: Not Null
  description: Text
  total_floors: Integer (auto-calculated)
  total_rooms: Integer
  contact_name, contact_phone, contact_email
  default_pricing: electricity_price, water_price, internet_fee, etc.
  created_at, updated_at
  is_deleted, deleted_at, deleted_by_id (Soft Delete)
)
```

#### 3. Rooms (Phòng)
```sql
rooms (
  id: Primary Key
  property_id: Foreign Key → properties
  floor_id: Foreign Key → floors
  room_code: Unique, Not Null
  room_name: Not Null
  area: Decimal (m²)
  rent_price: Decimal
  status: Enum (AVAILABLE, OCCUPIED, MAINTENANCE)
  is_dormitory: Boolean
  max_occupants: Integer
  amenities: JSON
  created_at, updated_at
  is_deleted, deleted_at, deleted_by_id
)
```

#### 4. Tenants (Người thuê)
```sql
tenants (
  id: Primary Key
  full_name: Not Null
  id_card: Unique, Not Null
  phone: Not Null
  email
  date_of_birth
  permanent_address
  emergency_contact_name, emergency_contact_phone
  notes
  is_active: Boolean
  created_at, updated_at
  is_deleted, deleted_at, deleted_by_id
)
```

#### 5. Contracts (Hợp đồng)
```sql
contracts (
  id: Primary Key
  contract_code: Unique (CT{YEAR}{MONTH}{SEQUENCE})
  tenant_id: Foreign Key → tenants
  room_id: Foreign Key → rooms
  bed_id: Foreign Key → beds (nullable)
  start_date, end_date: Date
  payment_day: Integer (1-31)
  payment_cycle: Enum (MONTHLY, QUARTERLY, YEARLY)
  rent_amount, deposit_amount: Decimal
  status: Enum (DRAFT, ACTIVE, EXPIRED, CANCELLED)
  terms_and_conditions, notes: Text
  signed_date: Date
  landlord_signature, tenant_signature: String
  created_at, updated_at
  is_deleted, deleted_at, deleted_by_id
)
```

#### 6. Invoices (Hóa đơn)
```sql
invoices (
  id: Primary Key
  invoice_code: Unique (INV{YEAR}{MONTH}{SEQUENCE})
  contract_id: Foreign Key → contracts
  period_start, period_end, due_date: Date
  status: Enum (UNPAID, PAID, OVERDUE, CANCELLED)
  subtotal, tax, discount, total_amount, paid_amount: Decimal
  payment_date, payment_method, payment_reference
  notes: Text
  created_at, updated_at
  is_deleted, deleted_at, deleted_by_id
)
```

#### 7. Invoice Items (Chi tiết hóa đơn)
```sql
invoice_items (
  id: Primary Key
  invoice_id: Foreign Key → invoices
  description: Not Null
  quantity, unit_price, amount: Decimal
  item_type: String (rent, electricity, water, etc.)
  meter_reading_id: Foreign Key → meter_readings
)
```

#### 8. Audit Logs (Nhật ký kiểm toán)
```sql
audit_logs (
  id: Primary Key
  user_id: Foreign Key → users
  action: Enum (CREATE, UPDATE, DELETE, RESTORE, LOGIN, 
                TRANSFER_ROOM, CHECKOUT, EXTEND_CONTRACT, etc.)
  entity_type: String (property, room, tenant, contract, etc.)
  entity_id: Integer
  description: Text
  old_value, new_value, changes: JSON
  ip_address, user_agent: String
  created_at: DateTime
  
  Indexes: entity_type, entity_id, created_at, user_id
)
```

#### 9. Attachments (Tệp đính kèm)
```sql
attachments (
  id: Primary Key
  filename: Unique (with timestamp)
  original_filename: Not Null
  file_path, file_size: Not Null
  file_hash: String(64) SHA256
  mime_type: String
  type: Enum (IMAGE, DOCUMENT, VIDEO, OTHER)
  description: Text
  uploaded_by_id: Foreign Key → users
  
  # Foreign Keys to all entities
  property_id, room_id, tenant_id, contract_id, 
  maintenance_request_id, expense_id
  
  created_at: DateTime
)
```

### Additional Tables

10. **floors** - Tầng trong property
11. **beds** - Giường trong phòng dormitory
12. **meter_readings** - Chỉ số điện/nước
13. **maintenance_requests** - Yêu cầu bảo trì
14. **expenses** - Chi phí
15. **notifications** - Thông báo

### Enums

```python
UserRole: ADMIN, MANAGER, STAFF
PropertyType: MINI_APARTMENT, ROOM_RENTAL, DORMITORY
RoomStatus: AVAILABLE, OCCUPIED, MAINTENANCE
ContractStatus: DRAFT, ACTIVE, EXPIRED, CANCELLED
PaymentCycle: MONTHLY, QUARTERLY, YEARLY
InvoiceStatus: UNPAID, PAID, OVERDUE, CANCELLED
MaintenanceStatus: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
ExpenseCategory: MAINTENANCE, UTILITIES, SUPPLIES, SALARY, OTHER
NotificationType: INFO, WARNING, ERROR, SUCCESS
AttachmentType: IMAGE, DOCUMENT, VIDEO, OTHER
```

---

## 📚 API Documentation

### Authentication

#### POST /api/v1/auth/login
Đăng nhập và nhận JWT token.

**Request:**
```json
{
  "email": "admin@homestay.com",
  "password": "Admin@123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### GET /api/v1/auth/me
Lấy thông tin user hiện tại (sau khi login).

**Headers:** `Authorization: Bearer <token>`

### Properties API

#### GET /api/v1/properties
Danh sách tài sản.

**Query:** `?skip=0&limit=100`

#### POST /api/v1/properties
Tạo property mới.

#### GET /api/v1/properties/{id}/stats
Thống kê phòng (available/occupied/maintenance, occupancy_rate).

#### POST /api/v1/properties/{id}/floors
Tạo tầng mới.

### Contracts API

#### GET /api/v1/contracts
Danh sách hợp đồng với JOIN details (tenant_name, room_code, property_name).

#### POST /api/v1/contracts/{id}/extend
Gia hạn hợp đồng (1-36 tháng).

#### POST /api/v1/contracts/{id}/cancel
Hủy hợp đồng với lý do.

### Tenants API

#### POST /api/v1/tenants/{id}/transfer-room
**Chuyển phòng** - Đóng contract cũ, tạo contract mới.

**Request:**
```json
{
  "new_room_id": 5,
  "transfer_date": "2026-06-25",
  "reason": "Upgrade to larger room"
}
```

#### POST /api/v1/tenants/{id}/checkout
**Trả phòng** - Đóng contract, tạo final invoice.

**Request:**
```json
{
  "checkout_date": "2026-06-30",
  "reason": "Contract ended",
  "final_electricity": 150.5,
  "final_water": 12.3
}
```

**Response:**
```json
{
  "message": "Checkout completed successfully",
  "contract_code": "CT2026060002",
  "final_invoice": {
    "invoice_code": "INV2026060001",
    "total_amount": 4334250.0,
    "items": [
      {"description": "Rent (prorated)", "amount": 3500000.0},
      {"description": "Electricity (150.5 kWh)", "amount": 526750.0},
      {"description": "Water (12.3 m³)", "amount": 307500.0}
    ]
  }
}
```

### Upload API

#### POST /api/v1/upload
Upload files với entity linking.

**Form Data:**
- `files`: File[]
- `entity_type`: property/room/tenant/contract
- `entity_id`: integer
- `description`: string (optional)

### Audit Logs API

#### GET /api/v1/audit-logs
Lịch sử thay đổi với filters.

**Query:**
- `user_id`, `action`, `entity_type`, `entity_id`
- `from_date`, `to_date`, `search`

---

## 🎨 Tính năng chính

### 1. Quản lý Properties (Tài sản)

**Dashboard:**
- 📊 Thống kê phòng theo status
- 📈 Tỷ lệ lấp đầy (Occupancy Rate)
- 🏢 Quản lý tầng (Floors)
- 🖼️ Upload ảnh property

**Validation:**
- Không cho phép xóa nếu có contract ACTIVE/DRAFT
- Không cho phép xóa nếu có invoice UNPAID/OVERDUE
- Tự động update total_floors

### 2. Quản lý Contracts (Hợp đồng)

**Features:**
- 📝 Tạo hợp đồng với auto-generate code
- ⏰ Cảnh báo hợp đồng sắp hết hạn (≤30 ngày)
- 📅 Gia hạn (1-36 tháng)
- ❌ Hủy với lý do
- 🔄 Chuyển phòng
- 🚪 Trả phòng

**Business Logic:**
- Phòng phải AVAILABLE khi tạo contract
- Không overlap trên cùng phòng
- Tự động sync room status

### 3. Transfer Room (Chuyển phòng)

**Workflow:**
```
1. Chọn tenant → Click "Chuyển phòng"
2. Chọn phòng mới (AVAILABLE)
3. Nhập ngày chuyển và lý do
4. System:
   - Close contract cũ
   - Create contract mới
   - Update room statuses
   - Log TRANSFER_ROOM audit
```

### 4. Checkout (Trả phòng)

**Workflow:**
```
1. Chọn tenant → Click "Trả phòng"
2. Nhập ngày, lý do, chỉ số điện/nước
3. System:
   - Calculate prorated rent
   - Create final invoice
   - Close contract
   - Set room AVAILABLE
   - Log CHECKOUT audit
```

**Invoice Calculation:**
- Rent (tính theo ngày)
- Electricity: usage × price_per_kwh
- Water: usage × price_per_m3

### 5. Soft Delete System

Tất cả entities có:
- `is_deleted`, `deleted_at`, `deleted_by_id`
- Không mất dữ liệu lịch sử
- Maintain referential integrity

### 6. Audit Log System

**Ghi nhận:**
- CREATE, UPDATE, DELETE
- TRANSFER_ROOM, CHECKOUT, EXTEND_CONTRACT
- LOGIN, LOGOUT
- Old/New values JSON
- IP address & User Agent

### 7. File Upload System

**Features:**
- Multi-file upload
- Auto-resize images (max 1920x1920)
- SHA256 hash
- Storage: `uploads/{entity_type}/{entity_id}/`
- Validation: type, size (10MB), PIL verify

---

## 🔄 Luồng nghiệp vụ

### Use Case 1: Tạo hợp đồng mới

```
1. Admin tạo Property + Floors + Rooms
2. Admin tạo Tenant
3. Admin tạo Contract:
   - Chọn Tenant, Room (AVAILABLE)
   - Nhập dates, rent, deposit
   - Status = DRAFT/ACTIVE
4. System:
   - Auto-generate contract_code
   - Update room → OCCUPIED
   - Create audit log
```

### Use Case 2: Chuyển phòng

```
1. Tenant yêu cầu chuyển phòng
2. Manager → Tenants page → "Chuyển phòng"
3. Chọn phòng mới, ngày, lý do
4. System:
   - Close contract cũ (EXPIRED)
   - Create contract mới (ACTIVE)
   - Update room statuses
   - Log TRANSFER_ROOM
```

### Use Case 3: Trả phòng & Thanh toán

```
1. Tenant thông báo trả phòng
2. Manager kiểm tra chỉ số điện/nước
3. "Trả phòng" → Nhập dates, usage
4. System:
   - Calculate charges
   - Create final invoice with items
   - Close contract
   - Room → AVAILABLE
   - Log CHECKOUT
5. Manager thu tiền, mark PAID
```

---

## 🔐 Security & Authentication

### JWT Authentication

```
1. Login → POST /auth/login
2. Backend validates credentials
3. Generate JWT tokens (30 mins / 7 days)
4. Frontend stores in localStorage
5. API calls: Authorization: Bearer <token>
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access |
| **MANAGER** | CRUD properties/contracts |
| **STAFF** | View only |

### Password Security

- Bcrypt hashing (passlib)
- Min 6 characters
- Change password requires old password

### CORS Configuration

```python
# Development
allow_origins=["*"]

# Production
allow_origins=["https://yourdomain.com"]
```

---

## 🛠️ Troubleshooting

### Problem: Login 400 Bad Request

**Solution:** Added `CORSPreflightMiddleware` to handle OPTIONS requests.

```python
# backend/app/main.py
class CORSPreflightMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return JSONResponse(content={}, headers={...})
        return await call_next(request)
```

### Problem: TypeScript errors

**Solution:**
```typescript
// Prefix unused with underscore
(_e, value) => {}

// Add undefined checks
{value !== null && value !== undefined && (
  <Component />
)}
```

### Problem: Docker build fails

```bash
# Clean up
docker system prune -a

# Rebuild
docker compose build --no-cache
```

---

## 📖 Development Guide

### Project Structure

```
homestay-manager/
├── backend/         # FastAPI application
│   ├── alembic/     # DB migrations
│   ├── app/         # Source code
│   │   ├── api/     # Endpoints
│   │   ├── core/    # Security, audit
│   │   ├── models/  # SQLAlchemy
│   │   └── schemas/ # Pydantic
│   └── uploads/     # File storage
├── frontend/        # React application
│   └── src/
│       ├── pages/   # UI pages
│       ├── stores/  # State management
│       └── lib/     # API client
├── nginx/           # Reverse proxy
└── docker-compose.yml
```

### Adding New Feature

1. Create migration
2. Add model
3. Add schema
4. Add endpoint
5. Add frontend page

---

## 🚀 Production Deployment

### Checklist

- [ ] Change admin password
- [ ] Generate new SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure CORS_ORIGINS
- [ ] Set up SSL/TLS
- [ ] Configure backups
- [ ] Set up monitoring

### Backup

```bash
# Database
docker compose exec postgres pg_dump \
  -U homestay_user homestay_db > backup.sql

# Uploads
docker compose cp backend:/app/uploads ./backup_uploads
```

---

## 📞 Support

**API Docs:** http://localhost:8000/docs  
**Phase Reports:**
- [PHASE_1.1_COMPLETE.md](PHASE_1.1_COMPLETE.md) - Soft Delete + Audit
- [PHASE_1.2_COMPLETE.md](PHASE_1.2_COMPLETE.md) - File Upload
- [PHASE_1.3_COMPLETE.md](PHASE_1.3_COMPLETE.md) - Properties CRUD
- [PHASE_1.5_COMPLETE.md](PHASE_1.5_COMPLETE.md) - Transfer + Checkout

---

## 📝 License

**Version:** 1.0.0  
**Built with:** FastAPI + React + PostgreSQL + Docker  
**Last Updated:** 2026-06-23

---

**🎉 Hệ thống đã sẵn sàng! Happy Managing! 🏠**
