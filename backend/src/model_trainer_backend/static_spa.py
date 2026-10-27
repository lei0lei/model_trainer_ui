from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from model_trainer_backend.core.config import settings


def resolve_frontend_dist() -> Path | None:
    if settings.frontend_dist:
        dist = Path(settings.frontend_dist).expanduser().resolve()
    else:
        dist = Path(__file__).resolve().parents[3] / "frontend" / "dist"
    if (dist / "index.html").is_file():
        return dist
    return None


def mount_frontend(app: FastAPI) -> None:
    dist = resolve_frontend_dist()
    if dist is None:
        return

    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str) -> FileResponse:
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(dist / "index.html")
