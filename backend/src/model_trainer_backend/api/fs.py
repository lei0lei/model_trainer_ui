from fastapi import APIRouter, Depends, HTTPException, Query, status

from model_trainer_backend.api.deps import get_current_user
from model_trainer_backend.fs_browser import FsListing, list_fs
from model_trainer_backend.models import User

router = APIRouter(prefix="/api/fs", tags=["fs"])


@router.get("/entries", response_model=FsListing)
def get_entries(path: str = Query(default=""), _user: User = Depends(get_current_user)) -> FsListing:
    try:
        return list_fs(path)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Path not found") from None
    except PermissionError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Path not readable") from None
