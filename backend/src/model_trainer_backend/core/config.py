from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[3]
_REPO_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            _BACKEND_DIR / ".env",
            _REPO_ROOT / ".env",
            _REPO_ROOT / "deploy" / "model-trainer.env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Model Trainer UI"
    secret_key: str = "dev-change-me"
    access_token_expire_minutes: int = 60 * 12
    database_url: str = "sqlite:///./data/app.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    admin_username: str = "admin"
    admin_password: str = "admin123"
    frontend_dist: str = ""
    trust_proxy: bool = False
    login_ip_max_attempts: int = 10
    login_ip_window_seconds: int = 900
    login_user_max_attempts: int = 5
    login_user_window_seconds: int = 900
    register_ip_max_attempts: int = 5
    register_ip_window_seconds: int = 3600

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
