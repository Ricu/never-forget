from __future__ import annotations

from dataclasses import dataclass

from backend.application.services import CaptureIngestionService
from backend.application.web_services import (
    CaptureRunService,
    CaptureSessionService,
    CaptureSubmissionService,
    MemoryService,
    PersonService,
)
from backend.config import audio_dir, db_path, transcription_model
from backend.environment import has_openai_key, load_environment
from backend.infrastructure.audio_storage import ManagedAudioStorage
from backend.infrastructure.repositories import (
    SQLiteArtifactRepository,
    SQLiteCaptureSessionRepository,
    SQLitePersonRepository,
)
from backend.infrastructure.storage import SQLiteStore
from backend.infrastructure.transcription import OpenAITranscriptionAdapter
from backend.observability import setup_instrumentation


@dataclass
class BackendContainer:
    ingestion_service: CaptureIngestionService
    capture_submission_service: CaptureSubmissionService
    capture_run_service: CaptureRunService
    memory_service: MemoryService
    capture_session_service: CaptureSessionService
    person_service: PersonService
    audio_storage: ManagedAudioStorage


def build_service(model_name: str | None = None) -> CaptureIngestionService:
    return build_container(model_name=model_name).ingestion_service


def build_container(model_name: str | None = None) -> BackendContainer:
    load_environment()
    setup_instrumentation()
    if not has_openai_key():
        raise RuntimeError(
            "OPENAI_API_KEY is missing. Put it in a .env file at repo root "
            "or export it in your shell."
        )

    database_path = db_path()
    SQLiteStore(database_path).init_schema()

    persons = SQLitePersonRepository(database_path)
    memories = SQLiteArtifactRepository(database_path)
    capture_sessions = SQLiteCaptureSessionRepository(database_path)
    transcription = OpenAITranscriptionAdapter(model=transcription_model())
    managed_audio = ManagedAudioStorage(audio_dir())

    ingestion_service = CaptureIngestionService(
        person_query=persons,
        person_command=persons,
        artifact_command=memories,
        capture_session_command=capture_sessions,
        transcription=transcription,
        model_name=model_name,
    )
    capture_submission_service = CaptureSubmissionService(
        capture_sessions=capture_sessions,
        audio_storage=managed_audio,
        supported_audio_suffixes=ingestion_service.supported_audio_suffixes(),
    )
    capture_run_service = CaptureRunService(
        capture_sessions=capture_sessions,
        memories=memories,
        persons=persons,
        ingestion=ingestion_service,
    )
    memory_service = MemoryService(
        memories=memories,
        persons=persons,
        capture_sessions=capture_sessions,
    )
    capture_session_service = CaptureSessionService(
        capture_sessions=capture_sessions,
        memories=memories,
        audio_storage=managed_audio,
    )
    person_service = PersonService(
        persons=persons,
        memories=memories,
    )
    return BackendContainer(
        ingestion_service=ingestion_service,
        capture_submission_service=capture_submission_service,
        capture_run_service=capture_run_service,
        memory_service=memory_service,
        capture_session_service=capture_session_service,
        person_service=person_service,
        audio_storage=managed_audio,
    )
