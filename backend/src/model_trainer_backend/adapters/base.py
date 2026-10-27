from typing import Any, Protocol


class TrainerAdapter(Protocol):
    name: str

    def validate_config(self, cfg: dict[str, Any]) -> None: ...

    def start(self, job_id: str, cfg: dict[str, Any]) -> None: ...

    def stop(self, job_id: str) -> None: ...
