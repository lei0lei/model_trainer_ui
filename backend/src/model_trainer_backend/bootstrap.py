from sqlalchemy.orm import Session

from model_trainer_backend.core.config import settings
from model_trainer_backend.core.security import hash_password
from model_trainer_backend.models import User


def ensure_admin_user(db: Session) -> None:
    existing = db.query(User).filter(User.username == settings.admin_username).first()
    if existing is not None:
        return
    db.add(
        User(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
        )
    )
    db.commit()
