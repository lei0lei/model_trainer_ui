from typing import Any


class UltralyticsYoloAdapter:
    name = "ultralytics-yolo"

    def validate_config(self, cfg: dict[str, Any]) -> None:
        if not cfg.get("model"):
            raise ValueError("model is required")

    def start(self, job_id: str, cfg: dict[str, Any]) -> None:
        raise NotImplementedError("YOLO training worker is not wired yet")

    def stop(self, job_id: str) -> None:
        raise NotImplementedError("YOLO training worker is not wired yet")
