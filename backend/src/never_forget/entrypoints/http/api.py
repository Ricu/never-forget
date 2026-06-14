from fastapi import APIRouter

from never_forget.application.health_check import HealthCheckService


def build_api_router(health_check_service: HealthCheckService, api_prefix: str) -> APIRouter:
    router = APIRouter(prefix=api_prefix)

    @router.get("/health")
    def health() -> dict[str, str]:
        return health_check_service.run().to_dict()

    return router
