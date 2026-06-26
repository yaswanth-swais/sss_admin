from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/warehouse", tags=["warehouse"])


def require_warehousing(request: Request, db: Session = Depends(get_db)):
    """Dependency — must be authenticated + WAREHOUSING industry."""
    user = get_current_user(request, db)
    user_type = (user.user_type or "").upper()
    if user_type not in ("WAREHOUSING", "WAREHOUSE"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Forbidden: Requires WAREHOUSING module access",
        )
    return user


@router.get("/menu")
def get_menu(_=Depends(require_warehousing)):
    """Return warehouse module menu items."""
    return [
        "INBOUND RECEIVING",
        "OUTBOUND SHIPMENTS",
        "RETURNS",
        "REPLENISHMENTS",
        "CYCLE COUNT",
        "MIS REPORTS",
    ]


@router.get("/data")
def get_data(_=Depends(require_warehousing)):
    """Return warehouse dashboard data."""
    return {
        "analytics": {
            "weeklyRevenue": 45000,
            "activeWorkers": 34,
        },
        "orders": [
            {"id": "ORD-123", "customer": "John Doe",    "status": "Delivered",   "date": "2026-04-08"},
            {"id": "ORD-124", "customer": "Jane Smith",  "status": "Processing",  "date": "2026-04-09"},
        ],
        "inventory": [
            {"id": "1", "item": "Forklift parts", "quantity": 12, "status": "In Stock"},
            {"id": "2", "item": "Pallets",         "quantity": 2,  "status": "Low Stock"},
        ],
    }
