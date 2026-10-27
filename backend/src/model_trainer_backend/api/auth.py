from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from model_trainer_backend.api.deps import get_current_user
from model_trainer_backend.core.config import settings
from model_trainer_backend.core.rate_limit import client_ip, limiter, too_many_attempts
from model_trainer_backend.core.security import create_access_token, hash_password, verify_password
from model_trainer_backend.db import get_db
from model_trainer_backend.models import User
from model_trainer_backend.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_for(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.username), username=user.username)


def _login_keys(ip: str, username: str) -> tuple[str, str]:
    return f"login:ip:{ip}", f"login:user:{username.strip().lower()}"


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    wait = limiter.consume(
        f"register:ip:{client_ip(request)}",
        settings.register_ip_max_attempts,
        settings.register_ip_window_seconds,
    )
    if wait:
        raise too_many_attempts(wait)
    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken") from None
    db.refresh(user)
    return _token_for(user)


@router.post("/login", response_model=TokenResponse)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    ip_key, user_key = _login_keys(client_ip(request), body.username)
    for key, max_attempts, window in (
        (ip_key, settings.login_ip_max_attempts, settings.login_ip_window_seconds),
        (user_key, settings.login_user_max_attempts, settings.login_user_window_seconds),
    ):
        wait = limiter.retry_after(key, max_attempts, window)
        if wait:
            raise too_many_attempts(wait)

    user = db.scalars(select(User).where(User.username == body.username)).first()
    if user is None or not verify_password(body.password, user.password_hash):
        limiter.record(ip_key)
        limiter.record(user_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    limiter.reset(user_key)
    return _token_for(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
