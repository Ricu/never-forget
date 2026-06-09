from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    app_name: str = "Never Forget API"
    app_version: str = "0.1.0"
    environment: str = "development"
    api_prefix: str = "/api"
    cors_allowed_origins: tuple[str, ...] = (
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    )

    model_config = SettingsConfigDict(
        env_prefix="NEVER_FORGET_",
        env_file=".env",
        extra="ignore",
    )
