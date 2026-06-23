# 🚀 HƯỚNG DẪN CHẠY NHANH

## Cách 1: Sử dụng script tự động (Khuyến nghị)

### Windows:
```bash
start.bat
```

### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

## Cách 2: Chạy thủ công

```bash
# Khởi động ứng dụng
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng ứng dụng
docker-compose down
```

## Truy cập ứng dụng

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000

## Kiểm tra trạng thái

```bash
# Xem các containers đang chạy
docker ps

# Xem logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Xử lý lỗi

### Port 80 đã được sử dụng
Chỉnh sửa `docker-compose.yml`, dòng:
```yaml
frontend:
  ports:
    - "8080:80"  # Thay 80 thành 8080
```

### Rebuild từ đầu
```bash
docker-compose down -v
docker-compose up -d --build
```

## Demo nhanh

1. Mở trình duyệt: http://localhost
2. Click "Dome" → "Thêm Dome mới"
3. Tạo Dome đầu tiên
4. Click vào Dome → "Thêm phòng"
5. Click vào phòng → "+ Giường"
6. Vào "Hợp đồng" → Tạo hợp đồng
7. Quay lại Dome → "Gán HĐ" cho giường

Xem chi tiết trong [README.md](README.md)
