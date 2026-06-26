from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.models import User


def create_access_token(data: dict) -> str:
    """Generate a JWT token valid for JWT_EXPIRE_DAYS days."""
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_token_from_request(request: Request) -> Optional[str]:
    """Extract JWT from httpOnly cookie or Authorization header."""
    token = request.cookies.get("token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    return token


def get_current_user(request: Request, db: Session) -> User:
    """
    Decode JWT, fetch fresh user from DB.
    Raises 401 if token is missing/invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )

    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
        )

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("id")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Always fetch fresh from DB so is_active / registration_complete are current
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception

    return user


def require_head(user: User) -> User:
    """Raise 403 if user is not HEAD."""
    if user.role != "HEAD":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. HEAD role required.",
        )
    return user
