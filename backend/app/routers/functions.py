from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/functions", tags=["functions"])

ALL_FUNCTIONS = [
    "LOGISTICS",
    "WAREHOUSING",
    "ECOMMERCE",
    "MANUFACTURING",
    "BANKING",
    "HEALTHCARE",
    "EDUTECH",
]


@router.get("")
def get_functions(request: Request, db: Session = Depends(get_db)):
    """Return all industry modules with enabled flag based on user's registered type."""
    user = get_current_user(request, db)
    user_type = (user.user_type or "").upper()

    return [
        {"name": func, "enabled": func == user_type}
        for func in ALL_FUNCTIONS
    ]
