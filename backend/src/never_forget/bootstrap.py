from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allowed_origins),
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    app.include_router(build_api_router(health_check_service, settings.api_prefix))
    return app


app = create_app()
