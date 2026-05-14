from __future__ import annotations

import json
from pathlib import Path

from backend.application.web_services import (
    CaptureRunService,
    CaptureSessionService,
    CaptureSubmissionService,
    MemoryService,
    PersonService,
)
from backend.bootstrap import BackendContainer
from backend.domain.models import ArtifactInput, ExtractionResult
from backend.entrypoints.http_api import create_app
from backend.infrastructure.audio_storage import ManagedAudioStorage
from backend.infrastructure.repositories import (
    SQLiteArtifactRepository,
    SQLiteCaptureSessionRepository,
    SQLitePersonRepository,
)
from backend.infrastructure.storage import SQLiteStore
from fastapi.testclient import TestClient


class FakeTranscription:
    def supported_suffixes(self) -> set[str]:
        return {".wav", ".webm"}

    def transcribe(self, audio_path: Path) -> str:
        return f"Transcript for {audio_path.stem}"


class FakeIngestionService:
    def __init__(
        self,
        *,
        memories: SQLiteArtifactRepository,
        persons: SQLitePersonRepository,
    ) -> None:
        self._memories = memories
        self._persons = persons
        self._transcription = FakeTranscription()

    def supported_audio_suffixes(self) -> set[str]:
        return self._transcription.supported_suffixes()

    def extract_transcript(
        self,
        *,
        capture_session_id: str,
        transcript: str,
    ) -> ExtractionResult:
        person = self._persons.create_person(name="Anna", aliases=["Ann"])
        created = self._memories.ingest_artifacts(
            capture_session_id=capture_session_id,
            memories=[
                ArtifactInput(
                    type="friend_note",
                    title="Anna note",
                    text=transcript,
                    linked_entities=[{"type": "person", "id": person.id}],
                )
            ],
        )
        return ExtractionResult(
            capture_session_id=capture_session_id,
            persisted_artifact_ids=[memory.id for memory in created],
            created_person_ids=[person.id],
        )


def build_test_client(tmp_path: Path) -> TestClient:
    db_path = tmp_path / "test.db"
    SQLiteStore(db_path).init_schema()
    persons = SQLitePersonRepository(db_path)
    memories = SQLiteArtifactRepository(db_path)
    capture_sessions = SQLiteCaptureSessionRepository(db_path)
    audio_storage = ManagedAudioStorage(tmp_path / "audio")
    ingestion = FakeIngestionService(memories=memories, persons=persons)

    container = BackendContainer(
        ingestion_service=ingestion,  # type: ignore[arg-type]
        capture_submission_service=CaptureSubmissionService(
            capture_sessions=capture_sessions,
            audio_storage=audio_storage,
            supported_audio_suffixes=ingestion.supported_audio_suffixes(),
        ),
        capture_run_service=CaptureRunService(
            capture_sessions=capture_sessions,
            memories=memories,
            persons=persons,
            ingestion=ingestion,  # type: ignore[arg-type]
        ),
        memory_service=MemoryService(
            memories=memories,
            persons=persons,
            capture_sessions=capture_sessions,
        ),
        capture_session_service=CaptureSessionService(
            capture_sessions=capture_sessions,
            memories=memories,
            audio_storage=audio_storage,
        ),
        person_service=PersonService(
            persons=persons,
            memories=memories,
        ),
        audio_storage=audio_storage,
    )
    return TestClient(create_app(container))


def parse_sse(response_text: str) -> list[dict]:
    events: list[dict] = []
    for block in response_text.strip().split("\n\n"):
        if not block.strip():
            continue
        prefix = "data: "
        line = block.strip()
        if not line.startswith(prefix):
            continue
        events.append(json.loads(line[len(prefix) :]))
    return events


def test_text_capture_run_creates_memory_and_person(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)

    create_response = client.post("/api/captures", json={"text": "Anna likes hiking"})
    assert create_response.status_code == 200
    capture_session_id = create_response.json()["id"]

    run_response = client.post(
        "/api/ag-ui/capture-runs",
        json={
            "threadId": capture_session_id,
            "runId": "run_1",
            "state": {"captureSessionId": capture_session_id},
            "messages": [],
            "tools": [],
            "context": [],
            "forwardedProps": {},
        },
    )
    assert run_response.status_code == 200
    events = parse_sse(run_response.text)
    assert any(event["type"] == "RUN_STARTED" for event in events)
    assert any(
        event["type"] == "CUSTOM" and event["name"] == "artifacts_persisted"
        for event in events
    )
    assert any(event["type"] == "RUN_FINISHED" for event in events)

    memories_response = client.get("/api/memories")
    assert memories_response.status_code == 200
    memories = memories_response.json()
    assert len(memories) == 1
    assert memories[0]["text"] == "Anna likes hiking"
    assert memories[0]["linkedPersons"][0]["name"] == "Anna"

    persons_response = client.get("/api/persons")
    assert persons_response.status_code == 200
    persons = persons_response.json()
    assert len(persons) == 1


def test_audio_capture_run_transcribes_and_serves_audio(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)

    create_response = client.post(
        "/api/captures",
        files={"audio": ("voice.webm", b"audio-bytes", "audio/webm")},
        data={"source": "voice_recording"},
    )
    assert create_response.status_code == 200
    session = create_response.json()
    capture_session_id = session["id"]
    assert session["audioUrl"].endswith(
        f"/api/capture-sessions/{capture_session_id}/audio"
    )

    run_response = client.post(
        "/api/ag-ui/capture-runs",
        json={
            "threadId": capture_session_id,
            "runId": "run_audio",
            "state": {"captureSessionId": capture_session_id},
            "messages": [],
            "tools": [],
            "context": [],
            "forwardedProps": {},
        },
    )
    assert run_response.status_code == 200
    events = parse_sse(run_response.text)
    assert any(
        event["type"] == "CUSTOM" and event["name"] == "transcription_completed"
        for event in events
    )

    detail_response = client.get(f"/api/capture-sessions/{capture_session_id}")
    assert detail_response.status_code == 200
    session_detail = detail_response.json()
    assert session_detail["transcript"] == f"Transcript for {capture_session_id}"
    audio_response = client.get(session_detail["audioUrl"])
    assert audio_response.status_code == 200
    assert audio_response.content == b"audio-bytes"


def test_delete_capture_session_cascades_to_memories_and_audio(tmp_path: Path) -> None:
    client = build_test_client(tmp_path)

    create_response = client.post(
        "/api/captures",
        files={"audio": ("voice.webm", b"audio-bytes", "audio/webm")},
    )
    capture_session_id = create_response.json()["id"]
    audio_url = create_response.json()["audioUrl"]

    client.post(
        "/api/ag-ui/capture-runs",
        json={
            "threadId": capture_session_id,
            "runId": "run_delete",
            "state": {"captureSessionId": capture_session_id},
            "messages": [],
            "tools": [],
            "context": [],
            "forwardedProps": {},
        },
    )

    delete_response = client.delete(f"/api/capture-sessions/{capture_session_id}")
    assert delete_response.status_code == 204
    assert client.get("/api/memories").json() == []
    assert client.get(audio_url).status_code == 404
