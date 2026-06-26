from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserOut, RegisterRequest, UpdateIndustryRequest
from app.auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])

VALID_INDUSTRIES = {
    "LOGISTICS", "WAREHOUSING", "ECOMMERCE",
    "MANUFACTURING", "BANKING", "HEALTHCARE", "EDUTECH",
}


@router.get("/me", response_model=UserOut)
def get_me(request: Request, db: Session = Depends(get_db)):
    """Return the current authenticated user's profile."""
    return get_current_user(request, db)


@router.post("/register", response_model=UserOut)
def register(
    body: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Complete user registration — set personal details + industry."""
    user = get_current_user(request, db)

    industry = body.user_type.upper()
    if industry not in VALID_INDUSTRIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid industry: {body.user_type}",
        )

    user.first_name            = body.first_name
    user.last_name             = body.last_name
    user.name                  = f"{body.first_name} {body.last_name}".strip()
    user.phone_number          = body.phone_number
    user.dob                   = body.dob
    user.user_type             = industry
    user.registration_complete = True
    # is_active stays False — HEAD must activate

    db.commit()
    db.refresh(user)
    return user


@router.put("/update-industry")
def update_industry(
    body: UpdateIndustryRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Update industry/user_type (kept for frontend compatibility)."""
    user = get_current_user(request, db)

    industry = body.industry.upper()
    if industry not in VALID_INDUSTRIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid industry: {body.industry}",
        )

    user.user_type = industry
    db.commit()
    db.refresh(user)
    return {"message": "Industry updated", "user_type": user.user_type}
