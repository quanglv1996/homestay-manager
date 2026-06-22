"""Expenses endpoint - placeholder"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models import Expense
from app.schemas.expense import ExpenseResponse
from app.schemas.common import PaginatedResponse
from app.models.user import User

router = APIRouter()

@router.get("", response_model=PaginatedResponse[ExpenseResponse])
def list_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Expense)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return {"items": items, "total": total, "skip": skip, "limit": limit, "pages": (total + limit - 1) // limit}
