from dataclasses import asdict, dataclass
from typing import Literal


@dataclass(frozen=True, slots=True)
class HealthCheckResult:
    status: Literal["ok"]
    service: str
    environment: str
    version: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


class HealthCheckService:
    def __init__(self, *, service_name: str, environment: str, version: str) -> None:
        self._service_name = service_name
        self._environment = environment
        self._version = version

    def run(self) -> HealthCheckResult:
        return HealthCheckResult(
            status="ok",
            service=self._service_name,
            environment=self._environment,
            version=self._version,
        )
