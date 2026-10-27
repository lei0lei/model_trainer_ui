from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model_trainer_backend.api import auth, datasets, fs, hardware, health, jobs
from model_trainer_backend.bootstrap import ensure_admin_user
from model_trainer_backend.core.config import settings
from model_trainer_backend.db import Base, SessionLocal, engine, ensure_sqlite_columns
from model_trainer_backend.models import Dataset, TrainingJob, User  # noqa: F401
from model_trainer_backend.static_spa import mount_frontend


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()
    db = SessionLocal()
    try:
        ensure_admin_user(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(hardware.router)
app.include_router(fs.router)
app.include_router(jobs.router)
mount_frontend(app)


def run() -> None:
    import uvicorn

    uvicorn.run("model_trainer_backend.main:app", host="0.0.0.0", port=8000, reload=True)
