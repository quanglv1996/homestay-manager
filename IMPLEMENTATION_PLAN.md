# 📋 Kế hoạch triển khai đầy đủ hệ thống Homestay Manager

## 🎯 Mục tiêu
Xây dựng hệ thống quản lý homestay/dormitory cấp doanh nghiệp với đầy đủ tính năng CRUD, audit log, soft delete, file upload, import/export, và các tính năng nâng cao.

---

## ✅ Hiện trạng hệ thống (Đã có)

### Backend
- ✅ FastAPI + SQLAlchemy + PostgreSQL
- ✅ 15 bảng dữ liệu với quan hệ đầy đủ
- ✅ Authentication & Authorization (JWT + Role-based)
- ✅ API endpoints cơ bản cho tất cả entities
- ✅ Alembic migration
- ✅ Docker deployment

### Frontend
- ✅ React + TypeScript + Material-UI
- ✅ Login & Dashboard
- ✅ Rooms CRUD (cơ bản)
- ✅ Tenants CRUD (cơ bản)
- ✅ Invoices management (tạo, xem, thanh toán)
- ✅ Properties list (chỉ hiển thị)
- ✅ Responsive layout với sidebar

### Thiếu gì?
- ❌ Properties CRUD UI (chỉ có backend)
- ❌ Contracts CRUD UI (chỉ có backend)
- ❌ Soft delete cho tất cả entities
- ❌ Audit log system
- ❌ File upload (ảnh CCCD, ảnh phòng, ảnh tài sản)
- ❌ Chuyển phòng (transfer room)
- ❌ Trả phòng (checkout)
- ❌ Gia hạn hợp đồng (extend contract)
- ❌ Hủy hợp đồng (cancel contract)
- ❌ Thanh toán một phần (partial payment)
- ❌ Quản lý công nợ (debt management)
- ❌ Tìm kiếm nâng cao
- ❌ Recycle bin
- ❌ Bulk operations
- ❌ Import/Export Excel
- ❌ Export PDF
- ❌ Unit tests

---

## 🗺️ Roadmap triển khai

### 📦 Phase 1: Foundation Enhancement (1-2 tuần)
**Xây dựng nền tảng cho các tính năng nâng cao**

#### 1.1 Soft Delete & Audit Log System ⭐⭐⭐
**Ưu tiên: CAO NHẤT**

**Backend:**
- [ ] Thêm BaseModel với soft delete fields:
  ```python
  is_deleted: bool = False
  deleted_at: datetime | None
  deleted_by_id: int | None
  ```
- [ ] Tạo AuditLog table đầy đủ:
  ```python
  - user_id
  - action (CREATE/UPDATE/DELETE/LOGIN/etc)
  - entity_type (PROPERTY/ROOM/TENANT/etc)
  - entity_id
  - old_value (JSON)
  - new_value (JSON)
  - ip_address
  - user_agent
  - timestamp
  ```
- [ ] Decorator `@log_action` để tự động log
- [ ] Middleware để capture IP & User-Agent
- [ ] Sửa tất cả DELETE endpoints thành soft delete
- [ ] API endpoint `GET /api/v1/audit-logs` với filter

**Frontend:**
- [ ] Component `AuditLogViewer` để xem lịch sử
- [ ] Hiển thị old_value ↔ new_value
- [ ] Filter theo user, action, entity_type, date range

**Estimate:** 3-4 ngày

---

#### 1.2 File Upload System ⭐⭐⭐
**Ưu tiên: CAO**

**Backend:**
- [ ] Endpoint `POST /api/v1/upload` với validation:
  - File size limit (10MB)
  - Allowed extensions: jpg, jpeg, png, pdf
  - Virus scan (optional)
- [ ] Storage strategy:
  ```
  uploads/
    ├── properties/{property_id}/
    ├── rooms/{room_id}/
    ├── tenants/{tenant_id}/
    │   ├── id_card_front.jpg
    │   ├── id_card_back.jpg
    └── contracts/{contract_id}/
  ```
- [ ] Update Attachment model với metadata:
  - file_size
  - mime_type
  - checksum (MD5/SHA256)
- [ ] Endpoint `GET /api/v1/attachments/{id}/download`
- [ ] Endpoint `DELETE /api/v1/attachments/{id}` (soft delete)

**Frontend:**
- [ ] Component `FileUploader` với drag & drop
- [ ] Image preview trước khi upload
- [ ] Progress bar
- [ ] Component `ImageGallery` để xem ảnh
- [ ] Zoom in/out ảnh

**Estimate:** 3-4 ngày

---

#### 1.3 Enhanced Validation ⭐⭐
**Backend:**
- [ ] Pydantic schemas với validation đầy đủ:
  - Phone: regex VN format
  - Email: email validator
  - ID Card: 9 hoặc 12 số
  - Date: không được tương lai (ngày sinh)
  - Money: > 0
- [ ] Custom validators cho business logic:
  - Room capacity >= 1
  - Contract start_date < end_date
  - Invoice due_date >= issue_date

**Frontend:**
- [ ] Form validation với react-hook-form + yup
- [ ] Real-time validation
- [ ] Error messages tiếng Việt

**Estimate:** 2 ngày

---

### 📦 Phase 2: Core CRUD Complete (2-3 tuần)

#### 2.1 Properties Management ⭐⭐⭐
**Ưu tiên: CAO**

**Backend đã có, cần UI:**
- [ ] Page `Properties.tsx` với full CRUD:
  - Table: tên, mã, địa chỉ, loại, trạng thái
  - Create dialog: tất cả fields + upload ảnh
  - Edit dialog
  - Delete với validation (không cho xóa nếu có phòng active)
  - View detail: tabs cho Thông tin / Phòng / Tầng / Ảnh

**Features:**
- [ ] Upload nhiều ảnh (mặt tiền, tầng, phòng)
- [ ] Thêm/sửa/xóa tầng (floor)
- [ ] Cấu hình giá điện/nước default
- [ ] Hiển thị số phòng active/total

**Estimate:** 4-5 ngày

---

#### 2.2 Contracts Management ⭐⭐⭐
**Ưu tiên: CAO**

**UI hoàn chỉnh:**
- [ ] Page `Contracts.tsx` với full CRUD:
  - Table: mã HĐ, người thuê, phòng, từ ngày, đến ngày, trạng thái
  - Create dialog:
    - Select tenant (dropdown với tìm kiếm)
    - Select room (chỉ hiển thị phòng available)
    - Select payment cycle (MONTHLY/QUARTERLY/etc)
    - Deposit amount
    - Upload file HĐ scan
  - Edit dialog
  - View detail: tabs Thông tin / Hóa đơn / Lịch sử

**Advanced Features:**
- [ ] **Gia hạn hợp đồng**: Button "Gia hạn"
  - Dialog chọn thời gian: 3/6/12 tháng
  - Tự động tính end_date mới
  - Tạo audit log
- [ ] **Hủy hợp đồng**: Button "Hủy"
  - Dialog nhập lý do
  - Change status → CANCELLED
  - Tạo audit log
- [ ] **Kết thúc sớm**: Button "Kết thúc sớm"
  - Tính tiền phạt (nếu có)
  - Tạo hóa đơn cuối
  - Change status → TERMINATED

**Backend API cần thêm:**
```python
POST /api/v1/contracts/{id}/extend
POST /api/v1/contracts/{id}/cancel
POST /api/v1/contracts/{id}/terminate
```

**Estimate:** 5-6 ngày

---

#### 2.3 Enhanced Rooms & Tenants ⭐⭐

**Rooms:**
- [ ] Thêm bulk create: nhập P301,P302,P303 → tạo 3 phòng
- [ ] **Disable Room**: button để ngừng khai thác (không xóa)
- [ ] Upload ảnh phòng
- [ ] Lịch sử thay đổi giá

**Tenants:**
- [ ] Upload ảnh CCCD (mặt trước + mặt sau)
- [ ] **Chuyển phòng**: Button "Chuyển phòng"
  - Dialog chọn phòng mới
  - Hệ thống tự động:
    - Close contract cũ
    - Create contract mới
    - Log history
- [ ] **Trả phòng**: Button "Trả phòng"
  - Dialog nhập ngày trả + lý do
  - Tính tiền đến ngày trả
  - Tạo hóa đơn cuối (điện nước cuối)
  - Close contract
  - Change room status → AVAILABLE

**Backend API cần thêm:**
```python
POST /api/v1/tenants/{id}/transfer-room
POST /api/v1/tenants/{id}/checkout
POST /api/v1/rooms/bulk-create
POST /api/v1/rooms/{id}/disable
```

**Estimate:** 4-5 ngày

---

#### 2.4 Enhanced Invoices ⭐⭐⭐

**Partial Payment:**
- [ ] Update Invoice model:
  ```python
  paid_amount: Decimal = 0
  remaining_amount: Decimal (computed)
  payment_history: JSON[]
  ```
- [ ] API `POST /api/v1/invoices/{id}/pay`:
  ```json
  {
    "amount": 2000000,
    "payment_method": "CASH|TRANSFER|QR",
    "transaction_code": "...",
    "note": "..."
  }
  ```
- [ ] Frontend: Dialog "Thanh toán"
  - Hiển thị: Tổng / Đã thanh toán / Còn lại
  - Input số tiền thanh toán
  - Select payment method
  - History table

**Auto Invoice Generation:**
- [ ] Celery task chạy hàng tháng
- [ ] Tạo hóa đơn tự động cho tất cả contracts active
- [ ] Tính điện nước từ meter readings

**Estimate:** 3-4 ngày

---

### 📦 Phase 3: Advanced Features (2-3 tuần)

#### 3.1 Debt Management (Quản lý công nợ) ⭐⭐⭐

**Dashboard công nợ:**
- [ ] Page `Debts.tsx`:
  - Tổng phải thu
  - Đã thu
  - Còn nợ
  - Quá hạn
- [ ] Table:
  - Tenant name
  - Total debt
  - Overdue count
  - Last payment date
  - Action: Nhắc nợ
- [ ] Chart: Công nợ theo tháng
- [ ] Top 10 khách nợ nhiều nhất

**API:**
```python
GET /api/v1/debts/summary
GET /api/v1/debts/tenants
GET /api/v1/debts/overdue
```

**Estimate:** 3 ngày

---

#### 3.2 Search & Filter ⭐⭐⭐

**Global Search:**
- [ ] Search bar ở header
- [ ] Tìm kiếm tất cả: properties, rooms, tenants, contracts, invoices
- [ ] Hiển thị kết quả theo loại

**Advanced Filter:**
- [ ] Properties: loại, địa chỉ, trạng thái
- [ ] Rooms: mã phòng, trạng thái, giá từ-đến
- [ ] Tenants: tên, CCCD, SĐT, trạng thái
- [ ] Contracts: trạng thái, ngày từ-đến
- [ ] Invoices: trạng thái, tháng, năm

**Backend:**
- [ ] Query params với filter
- [ ] Pagination (skip, limit)
- [ ] Sorting

**Estimate:** 4 ngày

---

#### 3.3 Recycle Bin ⭐⭐

**UI:**
- [ ] Page `RecycleBin.tsx`:
  - Table: Tên, Loại, Người xóa, Ngày xóa
  - Actions: Khôi phục, Xóa vĩnh viễn
  - Chỉ Admin được truy cập

**API:**
```python
GET /api/v1/recycle-bin
POST /api/v1/recycle-bin/{type}/{id}/restore
DELETE /api/v1/recycle-bin/{type}/{id}/permanent
```

**Estimate:** 2 ngày

---

#### 3.4 Bulk Operations ⭐⭐

**UI:**
- [ ] Checkbox select nhiều items
- [ ] Bulk actions dropdown:
  - Xóa nhiều
  - Cập nhật giá điện hàng loạt
  - Cập nhật giá nước hàng loạt
  - Gửi thông báo hàng loạt
  - Tạo hóa đơn hàng loạt

**API:**
```python
POST /api/v1/rooms/bulk-update-electricity-price
POST /api/v1/rooms/bulk-update-water-price
POST /api/v1/tenants/bulk-delete
POST /api/v1/notifications/bulk-send
POST /api/v1/invoices/bulk-create
```

**Estimate:** 3 ngày

---

### 📦 Phase 4: Import/Export & Reports (1-2 tuần)

#### 4.1 Import Excel ⭐⭐

**Features:**
- [ ] Download template Excel
- [ ] Upload Excel file
- [ ] Validate data
- [ ] Preview trước khi import
- [ ] Import với progress bar

**Hỗ trợ import:**
- [ ] Tenants
- [ ] Rooms
- [ ] Contracts
- [ ] Invoices

**Library:** `openpyxl` (backend), `xlsx` (frontend)

**Estimate:** 4 ngày

---

#### 4.2 Export Excel/PDF ⭐⭐⭐

**Excel Export:**
- [ ] Danh sách người thuê
- [ ] Danh sách phòng
- [ ] Công nợ
- [ ] Doanh thu tháng/quý/năm
- [ ] Hóa đơn

**PDF Export:**
- [ ] Hóa đơn (template đẹp)
- [ ] Hợp đồng
- [ ] Báo cáo công nợ

**Library:** `reportlab` hoặc `WeasyPrint` (backend), `jsPDF` (frontend)

**Estimate:** 5 ngày

---

### 📦 Phase 5: Testing & Optimization (1 tuần)

#### 5.1 Unit Tests ⭐⭐

**Backend:**
- [ ] pytest fixtures
- [ ] Test CRUD cho tất cả endpoints
- [ ] Test authentication
- [ ] Test authorization (role-based)
- [ ] Test validation
- [ ] Test soft delete
- [ ] Coverage >= 80%

**Estimate:** 4 ngày

---

#### 5.2 Integration Tests ⭐⭐

**E2E scenarios:**
- [ ] User login → Create property → Create room → Create tenant → Create contract → Create invoice → Pay invoice
- [ ] Transfer room
- [ ] Checkout
- [ ] Extend contract

**Tools:** `pytest` + `httpx`

**Estimate:** 3 ngày

---

## 📊 Tổng kết thời gian

| Phase | Thời gian | Priority |
|-------|-----------|----------|
| Phase 1: Foundation | 1-2 tuần | ⭐⭐⭐ CAO |
| Phase 2: Core CRUD | 2-3 tuần | ⭐⭐⭐ CAO |
| Phase 3: Advanced | 2-3 tuần | ⭐⭐ TRUNG BÌNH |
| Phase 4: Import/Export | 1-2 tuần | ⭐⭐ TRUNG BÌNH |
| Phase 5: Testing | 1 tuần | ⭐⭐ TRUNG BÌNH |

**Tổng cộng:** 7-11 tuần (khoảng 2-3 tháng)

---

## 🎯 Đề xuất triển khai

### Option 1: Full Feature (2-3 tháng)
Triển khai đầy đủ tất cả tính năng theo roadmap trên.

### Option 2: MVP Extended (1 tháng) ⭐ KHUYẾN NGHỊ
Tập trung vào các tính năng **quan trọng nhất**:

**Week 1:**
- ✅ Soft delete + Audit log
- ✅ File upload (ảnh CCCD, ảnh phòng)

**Week 2:**
- ✅ Properties CRUD UI
- ✅ Contracts CRUD UI

**Week 3:**
- ✅ Chuyển phòng + Trả phòng
- ✅ Gia hạn/Hủy hợp đồng
- ✅ Thanh toán một phần

**Week 4:**
- ✅ Quản lý công nợ
- ✅ Export PDF hóa đơn
- ✅ Basic testing

**Sau đó:** Triển khai các tính năng còn lại dựa trên feedback thực tế.

### Option 3: Critical Only (1-2 tuần)
Chỉ làm những gì **cần thiết ngay lập tức**:
- Soft delete + Audit log
- Properties CRUD UI
- Contracts CRUD UI
- File upload cơ bản

---

## 🤔 Câu hỏi cho bạn

1. **Bạn muốn triển khai theo option nào?**
   - [ ] Option 1: Full Feature (2-3 tháng)
   - [ ] Option 2: MVP Extended (1 tháng) ⭐ Khuyến nghị
   - [ ] Option 3: Critical Only (1-2 tuần)

2. **Tính năng nào bạn cần NGAY NHẤT?** (chọn top 3)
   - [ ] Properties CRUD UI
   - [ ] Contracts CRUD UI
   - [ ] Soft delete + Audit log
   - [ ] File upload (ảnh CCCD, phòng)
   - [ ] Chuyển phòng + Trả phòng
   - [ ] Thanh toán một phần
   - [ ] Công nợ
   - [ ] Import/Export

3. **Bạn có team dev khác không?**
   - [ ] Không, chỉ mình tôi
   - [ ] Có, có thêm X người

4. **Timeline mong muốn?**
   - [ ] Càng nhanh càng tốt
   - [ ] 1 tháng
   - [ ] 2-3 tháng
   - [ ] Không gấp

---

## 🚀 Sẵn sàng bắt đầu!

Sau khi bạn trả lời các câu hỏi trên, tôi sẽ:
1. Điều chỉnh roadmap phù hợp
2. Bắt đầu code ngay lập tức
3. Commit code thường xuyên để bạn có thể test

**Let's build an amazing homestay management system! 🏠✨**
