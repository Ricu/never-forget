from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_ai import Agent

from never_forget.adapters.capture_agent import build_capture_agent
from never_forget.application.capture_sessions import CaptureSessionService
from never_forget.application.health_check import HealthCheckService
from never_forget.entrypoints.http.api import build_api_router
from never_forget.infrastructure.settings import AppSettings
from never_forget.infrastructure.sqlite_capture_sessions import SqliteCaptureSessionRepository


def create_app(
    *,
    settings: AppSettings | None = None,
    capture_session_service: CaptureSessionService | None = None,
    capture_agent: Agent[None, str] | None = None,
) -> FastAPI:
    settings = settings or AppSettings()
    health_check_service = HealthCheckService(
        service_name=settings.app_name,
        environment=settings.environment,
        version=settings.app_version,
    )
    capture_session_service = capture_session_service or CaptureSessionService(
        repository=SqliteCaptureSessionRepository(settings.capture_session_database_path)
    )
    capture_agent = capture_agent or build_capture_agent(settings.capture_agent_model)

    app = FastAPI(title=settings.app_name, version=settings.app_version)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_allowed_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    app.include_router(
        build_api_router(
            health_check_service=health_check_service,
            capture_session_service=capture_session_service,
            capture_agent=capture_agent,
            api_prefix=settings.api_prefix,
        )
    )
    return app


app = create_app()
