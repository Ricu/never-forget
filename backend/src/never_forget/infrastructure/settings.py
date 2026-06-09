from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    app_name: str = "Never Forget API"
    app_version: str = "0.1.0"
    environment: str = "development"
    api_prefix: str = "/api"

    model_config = SettingsConfigDict(
        env_prefix="NEVER_FORGET_",
        env_file=".env",
        extra="ignore",
    )
