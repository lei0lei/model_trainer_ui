# model-trainer-backend

FastAPI 控制面，使用 uv 管理依赖。

```powershell
cd backend
uv sync
uv run uvicorn model_trainer_backend.main:app --reload --host 0.0.0.0 --port 8000
```

默认管理员：`admin` / `admin123`。
