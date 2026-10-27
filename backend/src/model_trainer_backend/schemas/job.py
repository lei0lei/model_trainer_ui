from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

OptimizerName = Literal["auto", "SGD", "Adam", "AdamW", "RMSProp"]
CacheMode = Literal["False", "ram", "disk"]
TaskName = Literal["detect", "segment"]


class TrainConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    time: float | None = Field(default=None, ge=0, le=240)
    device: str = Field(default="cpu", max_length=64)
    imgsz: int = Field(default=640, ge=32, le=2048)
    task: TaskName = "detect"
    export_onnx: bool = False
    batch: int = Field(default=16, ge=-1, le=256)
    workers: int = Field(default=8, ge=0, le=32)
    patience: int = Field(default=100, ge=0, le=1000)
    optimizer: OptimizerName = "auto"
    lr0: float = Field(default=0.01, ge=0, le=1)
    lrf: float = Field(default=0.01, ge=0, le=1)
    momentum: float = Field(default=0.937, ge=0, le=1)
    weight_decay: float = Field(default=0.0005, ge=0, le=1)
    warmup_epochs: float = Field(default=3.0, ge=0, le=20)
    seed: int = Field(default=0, ge=0)
    amp: bool = True
    cache: CacheMode = "False"
    rect: bool = False
    cos_lr: bool = False
    close_mosaic: int = Field(default=10, ge=0, le=100)
    freeze: int | None = Field(default=None, ge=0, le=200)
    pretrained: bool = True
    mosaic: float = Field(default=1.0, ge=0, le=1)
    mixup: float = Field(default=0.0, ge=0, le=1)
    copy_paste: float = Field(default=0.0, ge=0, le=1)
    hsv_h: float = Field(default=0.015, ge=0, le=1)
    hsv_s: float = Field(default=0.7, ge=0, le=1)
    hsv_v: float = Field(default=0.4, ge=0, le=1)
    degrees: float = Field(default=0.0, ge=0, le=180)
    translate: float = Field(default=0.1, ge=0, le=1)
    scale: float = Field(default=0.5, ge=0, le=1)
    fliplr: float = Field(default=0.5, ge=0, le=1)
    flipud: float = Field(default=0.0, ge=0, le=1)
    overlap_mask: bool = True
    mask_ratio: int = Field(default=4, ge=1, le=8)
    plots: bool = True
    val: bool = True
    save_period: int = Field(default=-1, ge=-1, le=1000)


class JobCreate(BaseModel):
    dataset_id: int
    model_name: str = Field(default="yolov8s.pt", min_length=1, max_length=128)
    epochs: int = Field(default=100, ge=0, le=10000)
    config: TrainConfig = Field(default_factory=TrainConfig)


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    dataset_name: str
    model_name: str
    epochs: int
    status: str
    message: str
    task: str = "detect"
    device: str = "cpu"
    imgsz: int = 640
    export_onnx: bool = False
    time: float | None = None
    config: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class DeviceOut(BaseModel):
    id: str
    label: str
