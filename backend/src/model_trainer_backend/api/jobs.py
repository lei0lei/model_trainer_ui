from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from model_trainer_backend.api.deps import get_current_user
from model_trainer_backend.db import get_db
from model_trainer_backend.models import Dataset, TrainingJob, User
from model_trainer_backend.schemas.job import JobCreate, JobOut

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _to_out(job: TrainingJob, dataset_name: str) -> JobOut:
    return JobOut(
        id=job.id,
        dataset_id=job.dataset_id,
        dataset_name=dataset_name,
        model_name=job.model_name,
        epochs=job.epochs,
        status=job.status,
        message=job.message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.get("", response_model=list[JobOut])
def list_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[JobOut]:
    rows = db.execute(
        select(TrainingJob, Dataset.name)
        .join(Dataset, Dataset.id == TrainingJob.dataset_id)
        .where(TrainingJob.user_id == user.id)
        .order_by(TrainingJob.id.desc())
    ).all()
    return [_to_out(job, name) for job, name in rows]


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobOut:
    dataset = db.scalars(select(Dataset).where(Dataset.id == body.dataset_id, Dataset.user_id == user.id)).first()
    if dataset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    job = TrainingJob(
        user_id=user.id,
        dataset_id=dataset.id,
        model_name=body.model_name.strip(),
        epochs=body.epochs,
        status="queued",
        message="等待训练 Worker",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_out(job, dataset.name)


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JobOut:
    row = db.execute(
        select(TrainingJob, Dataset.name)
        .join(Dataset, Dataset.id == TrainingJob.dataset_id)
        .where(TrainingJob.id == job_id, TrainingJob.user_id == user.id)
    ).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    job, name = row
    return _to_out(job, name)
