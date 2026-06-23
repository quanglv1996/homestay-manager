# 🏠 Dome Homestay Manager

Ứng dụng quản lý mô hình cho thuê nhà ở dạng Dome với kiến trúc full-stack, chạy trên Docker.

## 📋 Tính năng

### Quản lý cấu trúc
- **Dome (Căn nhà)**: Quản lý các căn Dome
- **Phòng**: Mỗi Dome có nhiều phòng
- **Giường 2 tầng**: Mỗi phòng có nhiều giường, mỗi giường có 2 tầng (tầng trên và tầng dưới)
- **Vị trí thuê**: Mỗi tầng cho 1 người thuê

### Quản lý hợp đồng
- Tạo hợp đồng với thông tin người thuê
- Thông tin cơ bản: Tên, SĐT, Email, CMND/CCCD
- Thông tin hợp đồng: **Giá**, ngày bắt đầu, ngày kết thúc
- Thiết bị bàn giao: Thêm/xóa tùy ý
- Gắn hợp đồng vào vị trí giường cụ thể (tầng trên hoặc tầng dưới)
- **Giá thuê được lấy từ hợp đồng, không phải từ giường**

### Dashboard trực quan
- **Hiển thị dạng lưới**: Tất cả các Dome
- **Chi tiết Dome**: Click vào Dome để xem các phòng
- **Chi tiết phòng**: Click vào phòng để xem các giường
- **Giường 2 tầng**: Mỗi giường hiển thị 2 tầng (tầng trên và tầng dưới)
- **Trạng thái trực quan**: 
  - Vị trí trống (màu xanh)
  - Vị trí đã thuê (màu cam)
  - Hover để xem thông tin hợp đồng chi tiết

### Thống kê Dashboard
- 📊 Tổng số giường
- ✅ Số vị trí trống (mỗi giường = 2 vị trí)
- ⚠️ Vị trí sắp đến hạn đóng tiền (7 ngày tới)
- 🔴 Vị trí sắp hết hạn hợp đồng (30 ngày tới)

### Quản lý linh hoạt
- Thêm/Sửa/Xóa Dome
- Thêm/Sửa/Xóa phòng
- Thêm/Sửa/Xóa giường
- Gán/Gỡ hợp đồng từ giường

## 🛠️ Công nghệ sử dụng

### Python 3.11** + **FastAPI**: Modern REST API framework
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server
- **Node.js** + **Express**: REST API
- **File-based storage**: Lưu trữ dữ liệu trong file JSON
- **UUID**: Tạo ID duy nhất

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **React Router**: Routing
- **Axios**: HTTP client
- **CSS3**: Styling với gradient và animations

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Web server cho frontend

## 🚀 Cài đặt và Chạy

### Yêu cầu
- Docker Desktop phiên bản mới nhất
- Docker Compose

### Chạy ứng dụng

1. **Clone hoặc giải nén project**
```bash
cd homestay-manager
```

2. **Khởi động ứng dụng bằng Docker Compose**
```bash
docker-compose up -d
```

3. **Truy cập ứng dụng**8000
- API Documentation: http://localhost:8000/docs (Swagger UI)
- Frontend: http://localhost
- Backend API: http://localhost:3000

### Dừng ứng dụng
```bash
docker-compose down
```

### Xem logs
```bash
# Xem tất cả logs
docker-compose logs -f

# Xem logs của backend
docker-compose logs -f backend

# Xem logs của frontend
docker-compose logs -f frontend
```

### Rebuild sau khi thay đổi code
```bash
docker-compose down
docker-compose up -d --build
```
-python/data/` với các file JSON:

- `houses.json`: Danh sách các Dome
- `rooms.json`: Danh sách phòng
- `beds.json`: Danh sách giường (không có giá)
- `contracts.json`: Danh sách hợp đồng (có giá)
- `assignments.json`: Liên kết giữa giường, tầng (top/bottom)
- `beds.json`: Danh sách giường
- `contracts.json`: Danh sách hợp đồng
- `assignments.json`: Liên kết giữa giường và hợp đồng

## 📁 Cấu trúc Project

```
homestay-ma-python/             # Backend Python + FastAPI
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── models.py          # Pydantic models
│   │   ├── data_service.py    # Business logic
│   │   └── __init__.py
│   ├── data/                  # Dữ liệu JSON (tự động tạo)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── package.json
│   └── .dockerignore
│
├── frontend/                   # Frontend React + Vite
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Houses.jsx
│   │   │   ├── HouseDetail.jsx
│   │   │   └── Contracts.jsx
│   │   ├── services/          # API services
│   │   │   └── api.js
│   │   ├── App.jsx            # Main app component
│   │   ├── App.css            # Global styles
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf             # Nginx configuration
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
│
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # Tài liệu này
```

## 🎯 API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Lấy thống kê dashboard

### Houses (Dome)
- `GET /api/houses` - Lấy danh sách tất cả Dome
- `GET /api/houses/:id` - Lấy thông tin một Dome
- `POST /api/houses` - Tạo Dome mới
- `PUT /api/houses/:id` - Cập nhật Dome
- `DELETE /api/houses/:id` - Xóa Dome

### Rooms (Phòng)
- `GET /api/rooms?houseId=xxx` - Lấy danh sách phòng (theo Dome)
- `GET /api/rooms/:id` - Lấy thông tin một phòng
- `POST /api/rooms` - Tạo phòng mới
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng

### Beds (Giường)
- `GET /api/beds?roomId=xxx` - Lấy danh sách giường (theo phòng)
- `GET /api/beds/:id` - Lấy thông tin một giường
- `POST /api/beds` - Tạo giường mới
- `PUT /api/beds/:id` - Cập nhật gi (không cần giá)ường
- `DELETE /api/beds/:id` - Xóa giường

### Contracts (Hợp đồng)
- `GET /api/contracts` - Lấy danh sách tất cả hợp đồng
- `GET /api/contracts/:id` - Lấy thông tin một hợp đồng
- `POST /api/contracts` - Tạo hợp đồng mới
- `PUT /api/contracts/:id` - Cập nhật hợp  (bao gồm giá thuê)
- `PUT /api/contracts/:id` - Cập nhật hợp đồng
- `DELETE /api/contracts/:id` - Xóa hợp đồng

### Assignments (Gán hợp đồng)
- `GET /api/assignments` - Lấy danh sách tất cả gán hợp đồng
- `GET /api/assignments/bed/:bedId` - Lấy hợp đồng của một giường
- `POST /api/assignments` - Gán hợp đồng cho giường (cần chỉ định level: "top" hoặc "bottom")
- `DELETE /api/assignments/:id` - Xóa gán hợp đồng
- `DELETE /api/assignments/bed/:bedId/level/:level` - Xóa gán hợp đồng theo giường và tầ
## 💡 Hướng dẫn sử dụng

### 1. Thêm Dome đầu tiên
- Vào trang "Dome" từ menu
- Click "Thêm Dome mới"
- Nhập tên và mô tả
- Click "Thêm mới"

### 2. Thêm phòng vào Dome
- Click vào Dome vừa tạo
- Click "Thêm phòng"
- Nhập thông tin phòng
- Click "Thêm mới"

### 3. Thêm giường vào phòng
- Click vào phòng để mở rộng
- Click "+ Giường"
- Nhập tên, giá và mô tả
- Click "T và mô tả (không cần nhập giá)
- Click "Thêm mới"
- **Lưu ý**: Mỗi giường có 2 tầng (tầng trên và tầng dưới)
### 4. Tạo hợp đồng thuê
- Vào trang "Hợp đồng"
- Click "Thêm hợp đồng mới"
- **Nhập giá thuê** (giá được lấy từ hợp đồng, không phải từ giường)
- Điền đầy đủ thông tin người thuê
- Thêm thiết bị bàn giao (nếu có)
- Click "Thêm mới"

### 5. Gán hợp đồng cho giường
- Mỗi giường hiển thị 2 tầng (tầng trên và tầng dưới)
- Với vị trí trống, click "Gán HĐ"
- Chọn hợp đồng từ danh sách
- Click "Gán hợp đồng"

### 6. Xem thông tin người thuê
- Di chuột qua vị trí đã thuê (màu cam)
- Tooltip sẽ hiển thị thông tin hợp đồng (bao gồm giá thuê)
- Di chuột qua giường đã thuê (màu cam)
- Tooltip sẽ hiển thị thông tin hợp đồng

## 🔧 Tùy chỉnh

### Thay đổi port
Chỉnh sửa file `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Thay 80 thành port bạn muốn
  
  backend:
    ports:
      - "4000:3000"  # Thay 3000 thành port bạn muốn
```-python/data/`. Để backup:
```bash
# Copy toàn bộ thư mục data
cp -r backend-python/data backend-python/data.backup
```

### Restore dữ liệu
```bash
# Copy backup về thư mục data
cp -r backend-python/data.backup/* backend-python
```bash
# Copy backup về thư mục data
cp -r backend/data.backup/* backend/data/
```

## 🐛 Xử lý sự cố

### Container không khởi động
```bash
# Xem logs để tìm lỗi
docker-compose logs

# Restart containers
docker-compose restart
```

### Port bị chiếm
```bash8
# Kiểm tra port đang sử dụng (Windows)
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Thay đổi port trong docker-compose.yml
```

### Dữ liệu bị mất
```bash
# Kiểm tra volume
docker volume ls
-python
# Kiểm tra data directory
ls backend/data/
```

### Rebuild từ đầu
```bash
# Xóa containers, images và volumes
docker-compose down -v
docker-compose up -d --build
```

## 📝 Ghi chú
**Mỗi giường có 2 tầng** (tầng trên và tầng dưới), mỗi tầng có thể gán 1 hợp đồng riêng
- **Giá thuê được lấy từ hợp đồng**, không phải từ giường
- Mỗi vị trí (tầng) chỉ có thể gán 1 hợp đồng tại một thời điểm
- Khi xóa Dome, tất cả phòng và giường bên trong sẽ bị xóa
- Khi xóa phòng, tất cả giường bên trong sẽ bị xóa
- Khi xóa hợp đồng, tất cả gán hợp đồng liên quan sẽ bị xóa
- Khi xóa giường, cả 2 tầng sẽ bị xóa cùng với các hợp đồng liên kết
- Khi xóa phòng, tất cả giường bên trong sẽ bị xóa
- Khi xóa hợp đồng, tất cả gán hợp đồng liên quan sẽ bị xóa

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs: `docker-compose logs -f`
2. Kiểm tra containers đang chạy: `docker ps`
3. Restart ứng dụng: `docker-compose restart`

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.
