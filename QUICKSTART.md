# 🚀 Quick Start Guide - Homestay Manager

## Khởi chạy nhanh trong 3 bước

### Bước 1: Clone và Chuẩn bị
```bash
cd c:\Users\lequa\Desktop\homestay-manager
```

File `.env` đã được tạo sẵn với cấu hình mặc định.

### Bước 2: Khởi động Hệ thống
```bash
docker compose up -d --build
```

**Quá trình khởi động:**
1. ⏳ Build Docker images (lần đầu mất 3-5 phút)
2. 🗄️ Khởi động PostgreSQL
3. 🔄 Chạy database migrations tự động
4. 🌱 Seed dữ liệu mẫu
5. ⚡ Khởi động Backend API (port 8000)
6. ⚛️ Khởi động Frontend (port 3000)
7. 🌐 Khởi động Nginx (port 80)

### Bước 3: Truy cập Ứng dụng

**Sau khi tất cả services đã running (~2-3 phút):**

1. **Frontend**: http://localhost
2. **API Docs**: http://localhost/docs
3. **Backend API**: http://localhost/api/v1

### Đăng nhập

```
Email: admin@homestay.com
Password: Admin@123456
```

## 📋 Kiểm tra Trạng thái

### Xem logs
```bash
# Tất cả services
docker compose logs -f

# Chỉ backend
docker compose logs -f backend

# Chỉ frontend
docker compose logs -f frontend
```

### Kiểm tra services đang chạy
```bash
docker compose ps
```

Kết quả mong đợi:
```
NAME                 STATUS              PORTS
homestay-backend     Up                 0.0.0.0:8000->8000/tcp
homestay-frontend    Up                 0.0.0.0:3000->3000/tcp
homestay-nginx       Up                 0.0.0.0:80->80/tcp
homestay-postgres    Up (healthy)       0.0.0.0:5432->5432/tcp
```

## 🔧 Troubleshooting

### Nếu gặp lỗi port đã được sử dụng

```bash
# Dừng tất cả services
docker compose down

# Thay đổi port trong .env
# NGINX_PORT=8080

# Khởi động lại
docker compose up -d
```

### Nếu cần reset database

```bash
# Dừng và xóa tất cả
docker compose down -v

# Khởi động lại (sẽ tạo database mới)
docker compose up -d --build
```

### Xem chi tiết lỗi

```bash
# Backend logs
docker compose logs backend

# Database logs
docker compose logs postgres
```

## 🎯 Các thao tác thường dùng

### Dừng hệ thống
```bash
docker compose down
```

### Khởi động lại
```bash
docker compose restart
```

### Rebuild sau khi thay đổi code
```bash
docker compose up -d --build
```

### Seed lại dữ liệu
```bash
docker compose exec backend python scripts/seed_database.py
```

### Truy cập database
```bash
docker compose exec postgres psql -U homestay_user -d homestay_db
```

### Backup database
```bash
docker compose exec postgres pg_dump -U homestay_user homestay_db > backup_$(date +%Y%m%d).sql
```

## ✅ Checklist Sau Khi Khởi động

- [ ] Truy cập http://localhost thành công
- [ ] Đăng nhập bằng tài khoản admin
- [ ] Xem được Dashboard với số liệu
- [ ] Truy cập http://localhost/docs thấy Swagger UI
- [ ] Kiểm tra menu Tài sản, Người thuê, Hợp đồng

## 🎓 Hướng dẫn Sử dụng

### 1. Tạo Tài sản mới
- Vào menu **Tài sản** (Properties)
- Click nút **Thêm mới**
- Chọn loại: Chung cư mini / Nhà cho thuê / Ký túc xá
- Điền thông tin và lưu

### 2. Tạo Phòng
- Chọn tài sản
- Thêm phòng với giá cho thuê
- Đối với ký túc xá: thêm số giường

### 3. Tạo Người thuê
- Vào menu **Người thuê** (Tenants)
- Thêm thông tin cá nhân
- Upload CCCD (optional)

### 4. Tạo Hợp đồng
- Vào menu **Hợp đồng** (Contracts)
- Chọn người thuê và phòng
- Điền thông tin hợp đồng
- Lưu

### 5. Tạo Hóa đơn
- Vào menu **Hóa đơn** (Invoices)
- Chọn hợp đồng
- Thêm các khoản phí
- Lưu và theo dõi thanh toán

## 🌟 Demo Data

Hệ thống đã có sẵn dữ liệu mẫu:

- ✅ 3 tài sản:
  - Chung cư mini Hoàng Mai (9 phòng)
  - Nhà trọ Nguyễn Trãi (5 phòng)
  - Ký túc xá Sinh viên (3 phòng, 24 giường)

- ✅ 3 người dùng:
  - Admin (toàn quyền)
  - Manager (quản lý)
  - Staff (nhân viên)

- ✅ 3 người thuê mẫu
- ✅ 1 hợp đồng đang hoạt động

## 📞 Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra logs: `docker compose logs -f`
2. Kiểm tra services: `docker compose ps`
3. Reset lại: `docker compose down -v && docker compose up -d --build`

---

**Happy coding! 🚀**
