from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from model_trainer_backend.api.deps import get_current_user
from model_trainer_backend.db import get_db
from model_trainer_backend.models import Dataset, TrainingJob, User
from model_trainer_backend.schemas.dataset import DatasetCreate, DatasetOut, dump_task_csv, parse_task_csv

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


def _owned_dataset(db: Session, user: User, dataset_id: int) -> Dataset:
    dataset = db.scalars(select(Dataset).where(Dataset.id == dataset_id, Dataset.user_id == user.id)).first()
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset


def _to_out(dataset: Dataset) -> DatasetOut:
    return DatasetOut(
        id=dataset.id,
        name=dataset.name,
        tasks=parse_task_csv(dataset.tasks or "detect"),
        description=dataset.description or "",
        source_path=dataset.source_path,
        created_at=dataset.created_at,
    )


@router.get("", response_model=list[DatasetOut])
def list_datasets(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[DatasetOut]:
    rows = db.scalars(select(Dataset).where(Dataset.user_id == user.id).order_by(Dataset.id.desc())).all()
    return [_to_out(item) for item in rows]


@router.post("", response_model=DatasetOut, status_code=status.HTTP_201_CREATED)
def create_dataset(
    body: DatasetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DatasetOut:
    dataset = Dataset(
        user_id=user.id,
        name=body.name.strip(),
        tasks=dump_task_csv(list(body.tasks)),
        description=body.description.strip(),
        source_path=body.source_path.strip(),
    )
    db.add(dataset)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset name already exists") from None
    db.refresh(dataset)
    return _to_out(dataset)


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DatasetOut:
    return _to_out(_owned_dataset(db, user, dataset_id))


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    dataset = _owned_dataset(db, user, dataset_id)
    job_exists = db.scalars(
        select(TrainingJob.id).where(TrainingJob.dataset_id == dataset.id).limit(1)
    ).first()
    if job_exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Dataset is used by a training job")
    db.delete(dataset)
    db.commit()
