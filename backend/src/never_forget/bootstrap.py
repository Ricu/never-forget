from fastapi import FastAPI

from never_forget.application.health_check import HealthCheckService
from never_forget.entrypoints.http.api import build_api_router
from never_forget.infrastructure.settings import AppSettings


def create_app() -> FastAPI:
    settings = AppSettings()
    health_check_service = HealthCheckService(
        service_name=settings.app_name,
        environment=settings.environment,
        version=settings.app_version,
    )

    app = FastAPI(title=settings.app_name, version=settings.app_version)
    app.include_router(build_api_router(health_check_service, settings.api_prefix))
    return app


app = create_app()
