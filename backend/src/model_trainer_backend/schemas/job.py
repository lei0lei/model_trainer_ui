from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    dataset_id: int
    model_name: str = Field(default="yolo11n.pt", min_length=1, max_length=128)
    epochs: int = Field(default=50, ge=1, le=1000)


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    dataset_name: str
    model_name: str
    epochs: int
    status: str
    message: str
    created_at: datetime
    updated_at: datetime
