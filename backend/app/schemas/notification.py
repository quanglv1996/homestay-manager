from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None


class NotificationUpdate(BaseModel):
    is_read: bool


class NotificationResponse(NotificationBase):
    id: int
    user_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
