"""Pydantic schemas for request/response validation"""

from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse,
    Token, LoginRequest, ChangePasswordRequest
)
from app.schemas.property import (
    PropertyBase, PropertyCreate, PropertyUpdate, PropertyResponse,
    FloorBase, FloorCreate, FloorUpdate, FloorResponse
)
from app.schemas.room import (
    RoomBase, RoomCreate, RoomUpdate, RoomResponse,
    BedBase, BedCreate, BedUpdate, BedResponse
)
from app.schemas.tenant import (
    TenantBase, TenantCreate, TenantUpdate, TenantResponse
)
from app.schemas.contract import (
    ContractBase, ContractCreate, ContractUpdate, ContractResponse
)
from app.schemas.invoice import (
    InvoiceBase, InvoiceCreate, InvoiceUpdate, InvoiceResponse,
    InvoiceItemBase, InvoiceItemCreate, InvoiceItemResponse,
    PaymentRequest
)
from app.schemas.meter_reading import (
    MeterReadingBase, MeterReadingCreate, MeterReadingUpdate, MeterReadingResponse
)
from app.schemas.maintenance import (
    MaintenanceRequestBase, MaintenanceRequestCreate,
    MaintenanceRequestUpdate, MaintenanceRequestResponse
)
from app.schemas.expense import (
    ExpenseBase, ExpenseCreate, ExpenseUpdate, ExpenseResponse
)
from app.schemas.notification import (
    NotificationBase, NotificationCreate, NotificationUpdate, NotificationResponse
)
from app.schemas.common import (
    PaginationParams, PaginatedResponse, MessageResponse, ErrorResponse
)

__all__ = [
    "UserBase", "UserCreate", "UserUpdate", "UserResponse",
    "Token", "LoginRequest", "ChangePasswordRequest",
    "PropertyBase", "PropertyCreate", "PropertyUpdate", "PropertyResponse",
    "FloorBase", "FloorCreate", "FloorUpdate", "FloorResponse",
    "RoomBase", "RoomCreate", "RoomUpdate", "RoomResponse",
    "BedBase", "BedCreate", "BedUpdate", "BedResponse",
    "TenantBase", "TenantCreate", "TenantUpdate", "TenantResponse",
    "ContractBase", "ContractCreate", "ContractUpdate", "ContractResponse",
    "InvoiceBase", "InvoiceCreate", "InvoiceUpdate", "InvoiceResponse",
    "InvoiceItemBase", "InvoiceItemCreate", "InvoiceItemResponse",
    "PaymentRequest",
    "MeterReadingBase", "MeterReadingCreate", "MeterReadingUpdate", "MeterReadingResponse",
    "MaintenanceRequestBase", "MaintenanceRequestCreate",
    "MaintenanceRequestUpdate", "MaintenanceRequestResponse",
    "ExpenseBase", "ExpenseCreate", "ExpenseUpdate", "ExpenseResponse",
    "NotificationBase", "NotificationCreate", "NotificationUpdate", "NotificationResponse",
    "PaginationParams", "PaginatedResponse", "MessageResponse", "ErrorResponse",
]
