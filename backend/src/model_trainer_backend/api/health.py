from fastapi import APIRouter

from model_trainer_backend.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}
