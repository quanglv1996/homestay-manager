#!/bin/bash

echo "========================================"
echo "  Dome Homestay Manager - Khởi động"
echo "========================================"
echo ""

echo "[1/3] Dừng các container đang chạy..."
docker-compose down

echo ""
echo "[2/3] Build và khởi động containers..."
docker-compose up -d --build

echo ""
echo "[3/3] Đợi containers khởi động..."
sleep 5

echo ""
echo "========================================"
echo "  Khởi động thành công!"
echo "========================================"
echo ""
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:3000"
echo ""
echo "Xem logs: docker-compose logs -f"
echo "Dừng ứng dụng: docker-compose down"
echo ""
