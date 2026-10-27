from fastapi import APIRouter, Depends

from model_trainer_backend.api.deps import get_current_user
from model_trainer_backend.hardware import list_train_devices
from model_trainer_backend.models import User
from model_trainer_backend.schemas.job import DeviceOut

router = APIRouter(prefix="/api/hardware", tags=["hardware"])


@router.get("/devices", response_model=list[DeviceOut])
def get_devices(_user: User = Depends(get_current_user)) -> list[DeviceOut]:
    return list_train_devices()
