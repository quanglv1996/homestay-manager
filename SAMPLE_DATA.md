# Dữ liệu mẫu để test

## Hướng dẫn sử dụng

Nếu bạn muốn có dữ liệu mẫu để test nhanh, copy các file JSON dưới đây vào thư mục `backend/data/`

## houses.json
```json
[
  {
    "id": "house-1",
    "name": "Dome A",
    "description": "Dome chính với 3 phòng lớn",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "house-2",
    "name": "Dome B",
    "description": "Dome phụ với 2 phòng",
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
]
```

## rooms.json
```json
[
  {
    "id": "room-1",
    "houseId": "house-1",
    "name": "Phòng 101",
    "description": "Phòng view núi",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "room-2",
    "houseId": "house-1",
    "name": "Phòng 102",
    "description": "Phòng view hồ",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "room-3",
    "houseId": "house-2",
    "name": "Phòng 201",
    "description": "Phòng VIP",
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
]
```

## beds.json
```json
[
  {
    "id": "bed-1",
    "roomId": "room-1",
    "name": "Giường A1",
    "price": 1500000,
    "description": "Giường gần cửa sổ",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "bed-2",
    "roomId": "room-1",
    "name": "Giường A2",
    "price": 1300000,
    "description": "Giường trong phòng",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "bed-3",
    "roomId": "room-2",
    "name": "Giường B1",
    "price": 1700000,
    "description": "Giường view hồ",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "bed-4",
    "roomId": "room-3",
    "name": "Giường VIP1",
    "price": 2000000,
    "description": "Giường VIP",
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
]
```

## contracts.json
```json
[
  {
    "id": "contract-1",
    "tenantName": "Nguyễn Văn A",
    "tenantPhone": "0901234567",
    "tenantEmail": "nguyenvana@email.com",
    "tenantIdCard": "001234567890",
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-12-01T00:00:00.000Z",
    "price": 1500000,
    "equipment": ["Tủ lạnh", "Máy giặt", "Điều hòa"],
    "notes": "Khách hàng thanh toán đúng hạn",
    "status": "active",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "contract-2",
    "tenantName": "Trần Thị B",
    "tenantPhone": "0912345678",
    "tenantEmail": "tranthib@email.com",
    "tenantIdCard": "001234567891",
    "startDate": "2026-06-15T00:00:00.000Z",
    "endDate": "2027-06-15T00:00:00.000Z",
    "price": 1700000,
    "equipment": ["Tủ lạnh", "Điều hòa", "Bàn làm việc"],
    "notes": "",
    "status": "active",
    "createdAt": "2026-06-15T00:00:00.000Z"
  }
]
```

## assignments.json
```json
[
  {
    "id": "assign-1",
    "bedId": "bed-1",
    "contractId": "contract-1",
    "createdAt": "2026-06-01T00:00:00.000Z"
  },
  {
    "id": "assign-2",
    "bedId": "bed-3",
    "contractId": "contract-2",
    "createdAt": "2026-06-15T00:00:00.000Z"
  }
]
```

## Cách import dữ liệu mẫu

### Cách 1: Copy thủ công
1. Tạo các file JSON trong thư mục `backend/data/`
2. Copy nội dung từ trên vào các file tương ứng
3. Restart container: `docker-compose restart backend`

### Cách 2: Thêm thủ công qua UI
1. Mở http://localhost
2. Thêm Dome, Phòng, Giường, Hợp đồng thông qua giao diện
