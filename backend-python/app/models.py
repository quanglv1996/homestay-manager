from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExtensionRecord(BaseModel):
    """Log của mỗi lần gia hạn hợp đồng"""
    extendedDate: str  # Ngày thực hiện gia hạn (format: YYYY-MM-DD)
    previousEndDate: str  # Ngày kết thúc trước khi gia hạn
    newEndDate: str  # Ngày kết thúc sau gia hạn
    extensionMonths: int  # Số tháng gia hạn
    notes: Optional[str] = ""  # Ghi chú gia hạn

class House(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Room(BaseModel):
    id: Optional[str] = None
    houseId: str
    name: str
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Bed(BaseModel):
    id: Optional[str] = None
    roomId: str
    name: str
    description: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class ParkingInfo(BaseModel):
    vehicleInfo: str  # Thông tin xe (loại xe, biển số)
    cardNumber: str   # Mã thẻ xe
    parkingFee: float # Phí gửi xe

class Contract(BaseModel):
    id: Optional[str] = None
    tenantName: str
    tenantPhone: str
    tenantEmail: Optional[str] = ""
    tenantIdCard: Optional[str] = ""
    startDate: str
    endDate: str  # Computed from startDate + durationMonths
    durationMonths: int  # Số tháng kí hợp đồng (1, 2, 3, 6, 12, ...)
    price: float  # Giá thuê cơ bản
    deposit: Optional[float] = None  # Tiền cọc (mặc định = price)
    renewalMonths: Optional[int] = 0  # Số tháng gia hạn thêm
    equipment: Optional[List[str]] = []
    images: Optional[List[str]] = []  # Danh sách URL hoặc base64 ảnh
    hasParking: Optional[bool] = False  # Có đăng ký gửi xe hay không
    parkingInfo: Optional[ParkingInfo] = None  # Thông tin gửi xe
    notes: Optional[str] = ""
    status: Optional[str] = "active"
    extensionHistory: Optional[List[ExtensionRecord]] = []  # Lịch sử gia hạn
    password: Optional[str] = None  # For API validation (not stored)
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"  # Allow extra fields like password
    
    def total_monthly_fee(self) -> float:
        """Tổng phí hàng tháng = giá thuê + phí gửi xe (nếu có)"""
        total = self.price
        if self.hasParking and self.parkingInfo:
            total += self.parkingInfo.parkingFee
        return total

class Assignment(BaseModel):
    id: Optional[str] = None
    bedId: str
    contractId: str
    level: str  # "top" or "bottom"
    createdAt: Optional[str] = None

class UtilityBill(BaseModel):
    """Hóa đơn điện nước phát sinh theo tháng"""
    id: Optional[str] = None
    contractId: str  # Hợp đồng nào
    month: str  # Tháng (YYYY-MM)
    amount: float  # Số tiền điện nước
    isPaid: Optional[bool] = False  # Đã đóng hay chưa
    paidDate: Optional[str] = None  # Ngày đóng
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class UtilityDistribution(BaseModel):
    """Phân bổ hóa đơn điện nước cho các hợp đồng"""
    id: Optional[str] = None
    billId: Optional[str] = None  # ID hóa đơn điện nước (có thể None nếu phân bổ trực tiếp từ chi phí house)
    roomId: Optional[str] = None  # Phòng nào (thêm field này cho thông tin)
    contractId: str  # Hợp đồng nào
    houseId: str  # Dome nào
    month: str  # Tháng (YYYY-MM)
    amount: float  # Số tiền phân bổ cho hợp đồng này
    isPaid: Optional[bool] = False  # Đã thanh toán hay chưa
    paidDate: Optional[str] = None  # Ngày thanh toán
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class Expense(BaseModel):
    """Khoản chi"""
    id: Optional[str] = None
    description: str  # Mô tả khoản chi
    amount: float  # Số tiền
    date: str  # Ngày chi
    category: Optional[str] = ""  # Loại chi chi tiết (sửa chữa, mua sắm, thuê nhà, ...)
    houseId: Optional[str] = None  # Dome nào (None = "Khác" - dùng chung)
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class RentExpense(BaseModel):
    """Chi phí thuê nhà cố định hàng tháng"""
    id: Optional[str] = None
    houseId: str  # Dome nào
    month: str  # Tháng (YYYY-MM)
    amount: float  # Số tiền thuê
    isPaid: Optional[bool] = False  # Đã thanh toán hay chưa
    paidDate: Optional[str] = None  # Ngày thanh toán
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class RentCollection(BaseModel):
    """Theo dõi thu tiền nhà theo hợp đồng hàng tháng"""
    id: Optional[str] = None
    contractId: str  # Hợp đồng nào
    month: str  # Tháng (YYYY-MM)
    isCollected: Optional[bool] = False  # Đã thu hay chưa
    collectionDate: Optional[str] = None  # Ngày thu
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class DashboardStats(BaseModel):
    totalBeds: int
    availablePositions: int
    occupiedPositions: int
    paymentDueSoon: int
    contractExpiringSoon: int
    
class RevenueStats(BaseModel):
    """Thống kê doanh thu theo tháng"""
    month: str  # YYYY-MM
    totalRevenue: float  # Tổng thu (từ hợp đồng + phí gửi xe)
    totalExpenses: float  # Tổng chi
    totalUtilityBills: float  # Tổng phí điện nước đã thu
    netRevenue: float  # Doanh thu thuần = thu - chi
