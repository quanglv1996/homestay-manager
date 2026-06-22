# 🏠 Homestay Manager

> Hệ thống quản lý cho thuê nhà/phòng trọ hoàn chỉnh, production-ready

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.2-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

## 📋 Mô tả

Homestay Manager là một hệ thống quản lý toàn diện cho việc cho thuê nhà, phòng trọ, và ký túc xá. Hệ thống được xây dựng với kiến trúc hiện đại, dễ mở rộng và ready for production.

### ✨ Tính năng chính

#### 🏢 Quản lý Tài sản
- **Chung cư mini**: Tự động tạo phòng theo tầng
- **Nhà cho thuê từng phòng**: Quản lý linh hoạt theo phòng
- **Ký túc xá**: Quản lý giường và chỗ ở tập thể
- Upload hình ảnh và tài liệu cho mỗi tài sản

#### 👥 Quản lý Người thuê
- Lưu trữ đầy đủ thông tin cá nhân
- Upload CCCD/CMND (mặt trước, mặt sau)
- Thông tin liên hệ khẩn cấp
- Lịch sử hợp đồng và thanh toán

#### 📝 Quản lý Hợp đồng
- Tạo hợp đồng cho phòng trọ hoặc giường dorm
- Hỗ trợ chu kỳ thanh toán: tháng/quý/năm
- Theo dõi trạng thái: Draft/Active/Expired/Cancelled
- Cảnh báo hợp đồng sắp hết hạn

#### 💰 Quản lý Hóa đơn
- Tự động sinh hóa đơn hàng tháng
- Tính toán chi tiết: tiền phòng + điện + nước + phí dịch vụ
- Trạng thái thanh toán với mã màu trực quan
- **Cảnh báo thông minh**:
  - 🟢 Xanh: Còn > 3 ngày
  - 🟠 Cam: Còn ≤ 3 ngày
  - 🔴 Đỏ: Đến hạn hoặc quá hạn

#### ⚡ Quản lý Điện nước
- Ghi chỉ số công tơ điện/nước
- Tự động tính sản lượng và thành tiền
- Upload ảnh công tơ
- Liên kết với hóa đơn

#### 🔧 Quản lý Bảo trì
- Tạo yêu cầu sửa chữa
- Theo dõi trạng thái: Pending/In Progress/Completed
- Quản lý chi phí sửa chữa
- Ghi chú giải pháp

#### 💵 Quản lý Chi phí
- Theo dõi các khoản chi phí vận hành
- Phân loại: Điện chung, nước chung, lương, bảo trì, v.v.
- Báo cáo lợi nhuận: Doanh thu - Chi phí

#### 📊 Dashboard Thống kê
- Tổng quan tài sản, phòng, người thuê
- Tỷ lệ lấp đầy realtime
- Doanh thu theo tháng/quý/năm
- Cảnh báo hóa đơn sắp đến hạn/quá hạn
- Cảnh báo hợp đồng sắp hết hạn
- Biểu đồ doanh thu trực quan

#### 🔐 Phân quyền Người dùng
- **Admin**: Toàn quyền quản lý hệ thống
- **Manager**: Quản lý tài sản và vận hành
- **Staff**: Xem và cập nhật thông tin

## 🏗️ Kiến trúc Hệ thống

```
homestay-manager/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/           # Security, dependencies
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── config.py       # Settings
│   │   ├── database.py     # Database config
│   │   └── main.py         # FastAPI app
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   ├── lib/           # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── nginx/                  # Nginx reverse proxy
│   └── nginx.conf
├── docker-compose.yml
├── .env
└── README.md
```

## 🚀 Cài đặt và Khởi chạy

### Yêu cầu

- Docker & Docker Compose
- Git

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd homestay-manager
```

### Bước 2: Cấu hình Environment

Copy file `.env.example` thành `.env` và điều chỉnh các giá trị:

```bash
cp .env.example .env
```

### Bước 3: Khởi động Hệ thống

```bash
docker compose up -d
```

Hệ thống sẽ:
1. Khởi động PostgreSQL
2. Chạy migrations tự động
3. Seed dữ liệu mẫu
4. Khởi động Backend (FastAPI)
5. Khởi động Frontend (React)
6. Khởi động Nginx

### Bước 4: Truy cập Ứng dụng

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/v1
- **API Documentation (Swagger)**: http://localhost/docs
- **ReDoc**: http://localhost/redoc

## 🔑 Tài khoản Mặc định

```
Admin:
Email: admin@homestay.com
Password: Admin@123456

Manager:
Email: manager@homestay.com
Password: Manager@123

Staff:
Email: staff@homestay.com
Password: Staff@123
```

## 📚 API Documentation

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@homestay.com",
  "password": "Admin@123456"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

### Resources

- `GET /api/v1/properties` - Danh sách tài sản
- `POST /api/v1/properties` - Tạo tài sản mới
- `GET /api/v1/properties/{id}` - Chi tiết tài sản
- `PUT /api/v1/properties/{id}` - Cập nhật tài sản
- `DELETE /api/v1/properties/{id}` - Xóa tài sản

Tương tự cho: `rooms`, `tenants`, `contracts`, `invoices`, `meter-readings`, `maintenance`, `expenses`

### Dashboard
```http
GET /api/v1/dashboard/stats
Authorization: Bearer <access_token>
```

Response:
```json
{
  "total_properties": 3,
  "total_rooms": 17,
  "occupied_rooms": 1,
  "available_rooms": 16,
  "occupancy_rate": 5.88,
  "total_tenants": 3,
  "active_contracts": 1,
  "revenue_this_month": 0,
  "unpaid_invoices": 0,
  "overdue_invoices": 0,
  "expiring_contracts": 0
}
```

## 🗄️ Database Schema

### Core Tables

1. **users** - Người dùng hệ thống
2. **properties** - Tài sản cho thuê
3. **floors** - Tầng (cho chung cư mini)
4. **rooms** - Phòng
5. **beds** - Giường (cho ký túc xá)
6. **tenants** - Người thuê
7. **contracts** - Hợp đồng thuê
8. **invoices** - Hóa đơn
9. **invoice_items** - Chi tiết hóa đơn
10. **meter_readings** - Chỉ số điện nước
11. **maintenance_requests** - Yêu cầu bảo trì
12. **expenses** - Chi phí vận hành
13. **notifications** - Thông báo
14. **attachments** - File đính kèm
15. **audit_logs** - Nhật ký thao tác

## 🛠️ Công nghệ Sử dụng

### Backend
- **FastAPI** - Modern web framework
- **SQLAlchemy 2.0** - ORM
- **PostgreSQL** - Database
- **Alembic** - Database migrations
- **Pydantic V2** - Data validation
- **JWT** - Authentication
- **Python 3.12**

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Material UI** - Component library
- **React Query** - Data fetching
- **React Router** - Routing
- **Zustand** - State management
- **Vite** - Build tool

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Nginx** - Reverse proxy

## 📦 Database Seeding

Dữ liệu mẫu bao gồm:

1. **3 users**: Admin, Manager, Staff
2. **3 properties**:
   - Chung cư mini Hoàng Mai (3 tầng, 9 phòng)
   - Nhà trọ Nguyễn Trãi (5 phòng)
   - Ký túc xá Sinh viên (3 phòng với giường)
3. **3 tenants** mẫu
4. **1 contract** mẫu đang active

## 🔧 Development

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed database
python scripts/seed_database.py

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Create New Migration

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 🚢 Production Deployment

### Environment Variables

Đảm bảo cấu hình đúng trong file `.env`:

```env
# Security
SECRET_KEY=<your-secure-random-key-min-32-chars>
POSTGRES_PASSWORD=<strong-password>

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
```

### Build & Deploy

```bash
# Build all services
docker compose build

# Start in production mode
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U homestay_user homestay_db > backup.sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U homestay_user homestay_db < backup.sql
```

## 📊 ERD (Entity Relationship Diagram)

```
users ──┐
        │
properties ──> floors ──> rooms ──> beds
        │                  │
        └──────────────────┼──> attachments
                           │
tenants ────────> contracts ──> invoices ──> invoice_items
        │                  │           │
        └──────────────────┼───────────┘
                           │
                    meter_readings
                           │
              maintenance_requests
                           │
                      expenses
                           │
                   notifications
                           │
                    audit_logs
```

## 🎯 Roadmap

### Phase 1 (Completed) ✅
- [x] Core system architecture
- [x] Authentication & Authorization
- [x] Property, Room, Tenant management
- [x] Contract & Invoice management
- [x] Dashboard with statistics
- [x] Docker deployment

### Phase 2 (Planned)
- [ ] QR Code for contracts & invoices
- [ ] File upload for room images
- [ ] Export reports (Excel, PDF)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced search & filters
- [ ] Audit log viewer

### Phase 3 (Future)
- [ ] Telegram Bot integration
- [ ] Zalo OA integration
- [ ] OCR for ID card auto-fill
- [ ] OCR for meter reading from photo
- [ ] AI revenue prediction
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark mode
- [ ] PWA support
- [ ] Automated backup system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ by Senior Fullstack Architect

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Note**: This is a production-ready system. Make sure to:
1. Change all default passwords
2. Use strong SECRET_KEY
3. Configure proper database credentials
4. Set up SSL/TLS for production
5. Enable firewall and security measures
6. Regular database backups
7. Monitor system logs
