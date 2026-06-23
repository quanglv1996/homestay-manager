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

# Lấy IP address của máy
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MACHINE_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    MACHINE_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
else
    MACHINE_IP=$(ipconfig | grep "IPv4 Address" | head -1 | awk '{print $NF}' 2>/dev/null || echo "YOUR_MACHINE_IP")
fi

echo ""
echo "========================================"
echo "  Khởi động thành công!"
echo "========================================"
echo ""
echo "🌐 Frontend (Web App):"
echo "  - Localhost: http://localhost"
echo "  - LAN Network: http://$MACHINE_IP"
echo ""
echo "🔌 Backend API:"
echo "  - Localhost: http://localhost:8000"
echo "  - LAN Network: http://$MACHINE_IP:8000"
echo ""
echo "📝 Lệnh hữu ích:"
echo "  - Xem logs: docker-compose logs -f"
echo "  - Dừng ứng dụng: docker-compose down"
echo "  - Khởi động lại: docker-compose restart"
echo ""
