from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

DatasetTask = Literal["detect", "segment"]
ALLOWED_TASKS = ("detect", "segment")


def parse_task_csv(raw: str) -> list[str]:
    items = [part.strip() for part in raw.split(",") if part.strip()]
    return [item for item in items if item in ALLOWED_TASKS]


def dump_task_csv(tasks: list[str]) -> str:
    unique: list[str] = []
    for item in tasks:
        if item not in unique:
            unique.append(item)
    return ",".join(unique)


class DatasetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    tasks: list[DatasetTask] = Field(min_length=1)
    description: str = Field(default="", max_length=512)
    source_path: str = Field(min_length=1, max_length=512)

    @field_validator("tasks")
    @classmethod
    def unique_tasks(cls, value: list[DatasetTask]) -> list[DatasetTask]:
        unique: list[DatasetTask] = []
        for item in value:
            if item not in unique:
                unique.append(item)
        if not unique:
            raise ValueError("Select at least one task")
        return unique


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    tasks: list[str]
    description: str
    source_path: str
    created_at: datetime
