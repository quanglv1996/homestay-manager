"""API v1 router"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    properties,
    rooms,
    tenants,
    contracts,
    invoices,
    meter_readings,
    maintenance,
    expenses,
    notifications,
    dashboard,
    reports,
    audit_logs,
    upload
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(properties.router, prefix="/properties", tags=["Properties"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(meter_readings.router, prefix="/meter-readings", tags=["Meter Readings"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(audit_logs.router, prefix="", tags=["Audit Logs"])
api_router.include_router(upload.router, prefix="", tags=["File Upload"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
