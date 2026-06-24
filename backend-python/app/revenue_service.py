"""Revenue calculation service for historical trends and analysis"""
from datetime import datetime, timedelta
from typing import List, Optional
from app import data_service


def get_revenue_history(months_count: int = 12, house_id: Optional[str] = None) -> List[dict]:
    """
    Get revenue statistics for the last N months
    
    Args:
        months_count: Number of months to retrieve (default 12)
        house_id: Optional house ID to filter by
    
    Returns:
        List of monthly revenue statistics
    """
    # Generate list of months to fetch
    now = datetime.now()
    months = []
    current = now.replace(day=1)
    
    for i in range(months_count):
        month_str = current.strftime("%Y-%m")
        months.append(month_str)
        # Go to previous month
        if current.month == 1:
            current = current.replace(year=current.year - 1, month=12)
        else:
            current = current.replace(month=current.month - 1)
    
    # Reverse to get chronological order (oldest to newest)
    months.reverse()
    
    # Fetch revenue stats for each month
    revenue_data = []
    
    if house_id:
        # Get revenue for specific house
        for month in months:
            stats_by_dome = data_service.get_revenue_stats_by_dome(month)
            dome_stat = next((d for d in stats_by_dome if d["houseId"] == house_id), None)
            
            if dome_stat:
                revenue_data.append({
                    "month": month,
                    "totalRevenue": dome_stat["totalRevenue"],
                    "projectedRevenue": 0,  # Not calculated per dome
                    "totalExpenses": dome_stat["totalExpenses"],
                    "netRevenue": dome_stat["netRevenue"]
                })
    else:
        # Get overall revenue for all houses
        for month in months:
            stats = data_service.get_revenue_stats(month)
            revenue_data.append({
                "month": month,
                "totalRevenue": stats["totalRevenue"],
                "projectedRevenue": stats["projectedRevenue"],
                "totalExpenses": stats["totalExpenses"],
                "netRevenue": stats["netRevenue"]
            })
    
    return revenue_data
