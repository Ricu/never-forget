from __future__ import annotations

from collections import Counter
import json
from pathlib import Path
from typing import Any

from ag_ui.core import (
    CustomEvent,
    EventType,
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StepFinishedEvent,
    StepStartedEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from ag_ui.encoder import EventEncoder

from backend.application.services import CaptureIngestionService
from backend.domain.models import (
    CaptureSession,
    LinkedEntityRef,
    Memory,
    Person,
    new_id,
)
from backend.infrastructure.audio_storage import ManagedAudioStorage
from backend.infrastructure.repositories import (
    SQLiteArtifactRepository,
    SQLiteCaptureSessionRepository,
    SQLitePersonRepository,
)


class CaptureSubmissionService:
    def __init__(
        self,
        capture_sessions: SQLiteCaptureSessionRepository,
        audio_storage: ManagedAudioStorage,
        supported_audio_suffixes: set[str],
    ) -> None:
        self._capture_sessions = capture_sessions
        self._audio_storage = audio_storage
        self._supported_audio_suffixes = supported_audio_suffixes

    def submit_text(self, text: str) -> CaptureSession:
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("Text input must not be empty")
        return self._capture_sessions.create_capture_session(
            transcript=cleaned,
            metadata={"source": "text", "status": "pending"},
        )

    def submit_audio(
        self,
        *,
        filename: str,
        content: bytes,
        source: str,
    ) -> CaptureSession:
        suffix = Path(filename).suffix.lower()
        if suffix not in self._supported_audio_suffixes:
            supported = ", ".join(sorted(self._supported_audio_suffixes))
            raise ValueError(
                f"Unsupported audio format '{suffix}'. Supported formats: {supported}"
            )

        capture_session_id = new_id("capture")
        audio_ref = self._audio_storage.store_bytes(
            capture_session_id=capture_session_id,
            content=content,
            suffix=suffix,
        )
        return self._capture_sessions.create_capture_session(
            transcript="",
            audio_ref=audio_ref,
            preferred_id=capture_session_id,
            metadata={
                "source": source,
                "status": "pending",
                "original_filename": filename,
            },
        )


class MemoryService:
    def __init__(
        self,
        memories: SQLiteArtifactRepository,
        persons: SQLitePersonRepository,
        capture_sessions: SQLiteCaptureSessionRepository,
    ) -> None:
        self._memories = memories
        self._persons = persons
        self._capture_sessions = capture_sessions

    def list_memories(
        self,
        *,
        query: str | None = None,
        memory_type: str | None = None,
    ) -> list[Memory]:
        return self._memories.list_memories(query=query, memory_type=memory_type)

    def get_memory(self, memory_id: str) -> Memory | None:
        return self._memories.get_memory(memory_id)

    def update_memory(
        self,
        memory_id: str,
        *,
        type: str,
        title: str | None,
        text: str,
        timeline_at: str | None,
        person_ids: list[str],
    ) -> Memory | None:
        linked_entities = [
            LinkedEntityRef(type="person", id=person_id) for person_id in person_ids
        ]
        return self._memories.update_memory(
            memory_id,
            type=type,
            title=title.strip() if title else None,
            text=text.strip(),
            linked_entities=linked_entities,
            timeline_at=timeline_at,
        )

    def delete_memory(self, memory_id: str) -> bool:
        return self._memories.delete_memory(memory_id)


class CaptureSessionService:
    def __init__(
        self,
        capture_sessions: SQLiteCaptureSessionRepository,
        memories: SQLiteArtifactRepository,
        audio_storage: ManagedAudioStorage,
    ) -> None:
        self._capture_sessions = capture_sessions
        self._memories = memories
        self._audio_storage = audio_storage

    def list_capture_sessions(self) -> list[CaptureSession]:
        return self._capture_sessions.list_capture_sessions()

    def get_capture_session(self, capture_session_id: str) -> CaptureSession | None:
        return self._capture_sessions.get_capture_session(capture_session_id)

    def update_transcript(
        self,
        capture_session_id: str,
        *,
        transcript: str,
    ) -> CaptureSession | None:
        cleaned = transcript.strip()
        if not cleaned:
            raise ValueError("Transcript must not be empty")
        return self._capture_sessions.update_capture_session(
            capture_session_id,
            transcript=cleaned,
        )

    def delete_capture_session(self, capture_session_id: str) -> bool:
        session = self._capture_sessions.get_capture_session(capture_session_id)
        if session is None:
            return False
        self._memories.delete_memories_for_capture_session(capture_session_id)
        self._capture_sessions.delete_capture_session(capture_session_id)
        self._audio_storage.delete(session.audio_ref)
        return True


class PersonService:
    def __init__(
        self,
        persons: SQLitePersonRepository,
        memories: SQLiteArtifactRepository,
    ) -> None:
        self._persons = persons
        self._memories = memories

    def list_persons(self, query: str | None = None) -> list[Person]:
        return self._persons.list_persons(query=query)

    def get_person(self, person_id: str) -> Person | None:
        return self._persons.get_person(person_id)

    def create_person(self, *, name: str, aliases: list[str]) -> Person:
        return self._persons.create_person(name=name, aliases=aliases)

    def update_person(
        self, person_id: str, *, name: str, aliases: list[str]
    ) -> Person | None:
        cleaned_aliases = [alias.strip() for alias in aliases if alias.strip()]
        return self._persons.update_person(
            person_id,
            name=name.strip(),
            aliases=cleaned_aliases,
        )

    def memories_for_person(self, person_id: str) -> list[Memory]:
        return self._memories.list_memories_for_person(person_id)


class CaptureRunService:
    def __init__(
        self,
        capture_sessions: SQLiteCaptureSessionRepository,
        memories: SQLiteArtifactRepository,
        persons: SQLitePersonRepository,
        ingestion: CaptureIngestionService,
    ) -> None:
        self._capture_sessions = capture_sessions
        self._memories = memories
        self._persons = persons
        self._ingestion = ingestion
        self._encoder = EventEncoder()

    def stream_run(self, run_input: RunAgentInput) -> Any:
        capture_session_id = str(
            (run_input.state or {}).get("captureSessionId", "")
        ).strip()
        if not capture_session_id:
            yield self._encode(
                RunErrorEvent(message="captureSessionId missing from AG-UI state")
            )
            return

        thread_id = run_input.thread_id
        run_id = run_input.run_id
        session = self._capture_sessions.get_capture_session(capture_session_id)
        if session is None:
            yield self._encode(RunErrorEvent(message="Capture session not found"))
            return

        existing_memories = self._memories.list_memories_for_capture_session(
            capture_session_id
        )
        if existing_memories:
            yield self._encode(
                RunErrorEvent(
                    message="Capture session has already been processed",
                    code="already_processed",
                )
            )
            return

        yield self._encode(RunStartedEvent(threadId=thread_id, runId=run_id))
        yield self._encode(
            CustomEvent(
                name="capture_session_ready",
                value={
                    "captureSessionId": session.id,
                    "hasAudio": bool(session.audio_ref),
                    "source": session.metadata.get("source"),
                },
            )
        )

        try:
            session = self._set_status(session.id, status="running")
            yield from self._assistant_message(
                "Capture received. Processing it now.",
            )

            transcript = session.transcript.strip()
            if session.audio_ref and not transcript:
                yield self._encode(StepStartedEvent(stepName="transcription"))
                yield self._encode(
                    CustomEvent(
                        name="transcription_started",
                        value={"captureSessionId": session.id},
                    )
                )
                yield from self._assistant_message("Transcribing the audio.")
                transcript = self._ingestion._transcription.transcribe(
                    Path(session.audio_ref)
                )
                yield from self._tool_call(
                    tool_name="transcribe_audio",
                    args={
                        "captureSessionId": session.id,
                        "audioRef": session.audio_ref,
                    },
                    result={"transcriptPreview": transcript[:200]},
                )
                session = self._set_status(
                    session.id,
                    status="transcribed",
                    transcript=transcript,
                )
                yield self._encode(
                    CustomEvent(
                        name="transcription_completed",
                        value={
                            "captureSessionId": session.id,
                            "transcript": transcript,
                        },
                    )
                )
                yield self._encode(StepFinishedEvent(stepName="transcription"))

            yield self._encode(StepStartedEvent(stepName="extraction"))
            yield from self._assistant_message("Extracting memories and contacts.")
            result = self._ingestion.extract_transcript(
                capture_session_id=session.id,
                transcript=transcript,
            )
            created_memories = self._memories.list_memories_for_capture_session(
                session.id
            )
            created_people = self._people_from_ids(result.created_person_ids)
            session = self._set_status(session.id, status="completed")
            yield from self._tool_call(
                tool_name="persist_artifacts",
                args={
                    "captureSessionId": session.id,
                    "memoryCount": len(created_memories),
                    "createdPersonIds": result.created_person_ids,
                },
                result={
                    "memoryIds": result.persisted_artifact_ids,
                    "createdPersons": created_people,
                },
            )
            yield self._encode(
                CustomEvent(
                    name="artifacts_persisted",
                    value={
                        "captureSessionId": session.id,
                        "memoryIds": result.persisted_artifact_ids,
                        "createdPersonIds": result.created_person_ids,
                        "createdPersons": created_people,
                        "memories": [
                            self._serialize_memory(memory)
                            for memory in created_memories
                        ],
                    },
                )
            )
            yield self._encode(StepFinishedEvent(stepName="extraction"))
            yield from self._assistant_message(
                self._build_summary(created_memories, result.created_person_ids)
            )
            yield self._encode(
                RunFinishedEvent(
                    threadId=thread_id,
                    runId=run_id,
                    result={
                        "captureSessionId": session.id,
                        "memoryIds": result.persisted_artifact_ids,
                        "createdPersonIds": result.created_person_ids,
                    },
                )
            )
        except Exception as exc:
            self._set_status(session.id, status="failed", error=str(exc))
            yield self._encode(
                RunErrorEvent(
                    message=str(exc),
                    code="capture_run_failed",
                )
            )

    def _set_status(
        self,
        capture_session_id: str,
        *,
        status: str,
        transcript: str | None = None,
        error: str | None = None,
    ) -> CaptureSession:
        existing = self._capture_sessions.get_capture_session(capture_session_id)
        if existing is None:
            raise ValueError("Capture session not found")
        metadata = dict(existing.metadata)
        metadata["status"] = status
        if error:
            metadata["error"] = error
        elif "error" in metadata:
            metadata.pop("error")
        updated = self._capture_sessions.update_capture_session(
            capture_session_id,
            transcript=transcript,
            metadata=metadata,
        )
        if updated is None:
            raise ValueError("Capture session not found")
        return updated

    def _assistant_message(self, text: str) -> Any:
        message_id = new_id("message")
        yield self._encode(TextMessageStartEvent(messageId=message_id))
        for chunk in _chunk_text(text):
            yield self._encode(
                TextMessageContentEvent(
                    messageId=message_id,
                    delta=chunk,
                )
            )
        yield self._encode(TextMessageEndEvent(messageId=message_id))

    def _tool_call(
        self,
        *,
        tool_name: str,
        args: dict[str, Any],
        result: dict[str, Any] | None = None,
    ) -> Any:
        tool_call_id = new_id("tool")
        yield self._encode(
            ToolCallStartEvent(
                toolCallId=tool_call_id,
                toolCallName=tool_name,
            )
        )
        yield self._encode(
            ToolCallArgsEvent(
                toolCallId=tool_call_id,
                delta=json.dumps(args),
            )
        )
        yield self._encode(ToolCallEndEvent(toolCallId=tool_call_id))
        if result is not None:
            yield self._encode(
                ToolCallResultEvent(
                    type=EventType.TOOL_CALL_RESULT,
                    messageId=new_id("tool_message"),
                    toolCallId=tool_call_id,
                    content=json.dumps(result),
                    role="tool",
                )
            )

    def _build_summary(
        self, memories: list[Memory], created_person_ids: list[str]
    ) -> str:
        memory_count = len(memories)
        person_count = len(created_person_ids)
        if memory_count == 0:
            return "Finished processing. No memories were created."
        counts = Counter(memory.type for memory in memories)
        parts = [f"Finished processing. Saved {memory_count} memories"]
        if person_count:
            parts.append(f"and created {person_count} contacts")
        detail = ", ".join(f"{count} {name}" for name, count in sorted(counts.items()))
        return f"{' '.join(parts)}. Types: {detail}."

    def _encode(self, event: Any) -> str:
        return self._encoder.encode(event)

    def _serialize_memory(self, memory: Memory) -> dict[str, Any]:
        linked_people = []
        for ref in memory.linked_entities:
            if ref.type != "person":
                continue
            person = self._persons.get_person(ref.id)
            if person is None:
                continue
            linked_people.append(
                {"id": person.id, "name": person.name, "aliases": person.aliases}
            )
        return {
            **memory.model_dump(mode="json"),
            "linkedPersons": linked_people,
        }

    def _people_from_ids(self, person_ids: list[str]) -> list[dict[str, Any]]:
        people = []
        for person_id in person_ids:
            person = self._persons.get_person(person_id)
            if person is None:
                continue
            people.append(
                {"id": person.id, "name": person.name, "aliases": person.aliases}
            )
        return people


def _chunk_text(text: str, size: int = 32) -> list[str]:
    cleaned = text.strip()
    if not cleaned:
        return [" "]
    return [cleaned[index : index + size] for index in range(0, len(cleaned), size)]
