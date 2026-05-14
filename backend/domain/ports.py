from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol

from backend.domain.models import ArtifactInput, CaptureSession, Memory, Person


class PersonQueryPort(Protocol):
    def search_persons(self, query: str, limit: int = 10) -> list[Person]: ...


class PersonCommandPort(Protocol):
    def create_person(
        self,
        name: str,
        aliases: list[str] | None = None,
    ) -> Person: ...


class ArtifactCommandPort(Protocol):
    def ingest_artifacts(
        self,
        capture_session_id: str,
        memories: list[ArtifactInput],
    ) -> list[Memory]: ...


class CaptureSessionCommandPort(Protocol):
    def create_capture_session(
        self,
        transcript: str,
        audio_ref: str | None = None,
        metadata: dict[str, Any] | None = None,
        preferred_id: str | None = None,
    ) -> CaptureSession: ...


class TranscriptionPort(Protocol):
    def transcribe(self, audio_path: Path) -> str: ...

    def supported_suffixes(self) -> set[str]: ...
