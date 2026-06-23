@echo off
echo ========================================
echo   Dome Homestay Manager - Khoi dong
echo ========================================
echo.

echo [1/3] Dung cac container dang chay...
docker-compose down

echo.
echo [2/3] Build va khoi dong containers...
docker-compose up -d --build

echo.
echo [3/3] Doi containers khoi dong...
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   Khoi dong thanh cong!
echo ========================================
echo.
echo Frontend: http://localhost
echo Backend API: http://localhost:3000
echo.
echo Xem logs: docker-compose logs -f
echo Dung ung dung: docker-compose down
echo.
pause
