"""Reports endpoint - placeholder"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_manager
from app.models.user import User

router = APIRouter()

@router.get("/revenue")
def get_revenue_report(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    """Get revenue report"""
    return {"message": "Revenue report endpoint - to be implemented"}

@router.get("/occupancy")
def get_occupancy_report(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    """Get occupancy report"""
    return {"message": "Occupancy report endpoint - to be implemented"}
