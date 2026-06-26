from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import User
from app.schemas import UserOut
from app.auth import get_current_user, require_head

router = APIRouter(prefix="/admin", tags=["admin"])


def get_head_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Dependency — must be authenticated AND have HEAD role."""
    user = get_current_user(request, db)
    return require_head(user)


@router.get("/users", response_model=List[UserOut])
def list_users(
    status: Optional[str] = "all",
    db: Session = Depends(get_db),
    _: User = Depends(get_head_user),
):
    """
    List users filtered by status.
    ?status=pending  → registered but not yet activated
    ?status=active   → activated users
    ?status=all      → everyone (default)
    """
    query = db.query(User)

    if status == "pending":
        query = query.filter(User.registration_complete == True, User.is_active == False)
    elif status == "active":
        query = query.filter(User.is_active == True)

    return query.order_by(User.createdAt.desc()).all()


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_head_user),
):
    """Get a single user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/users/{user_id}/activate", response_model=UserOut)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_head_user),
):
    """HEAD activates a registered user — grants dashboard access."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_head_user),
):
    """HEAD deactivates a user — revokes dashboard access."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
