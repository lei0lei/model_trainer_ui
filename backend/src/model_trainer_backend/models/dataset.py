from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column

from model_trainer_backend.db import Base


class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_datasets_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(String(512), default="", server_default=text("''"))
    tasks: Mapped[str] = mapped_column(String(64), default="detect", server_default=text("'detect'"))
    source_path: Mapped[str] = mapped_column(String(512), default="", server_default=text("''"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
