from __future__ import annotations

from pathlib import Path

from backend.adapters.pydantic_ai_agent import AgentDeps, build_extraction_agent
from backend.application.inputs import CaptureSource
from backend.domain.models import ExtractionResult
from backend.domain.ports import (
    ArtifactCommandPort,
    CaptureSessionCommandPort,
    PersonCommandPort,
    PersonQueryPort,
    TranscriptionPort,
)
from backend.observability import observe, set_trace_context


class CaptureIngestionService:
    _TEXT_SUFFIXES = {".txt", ".md"}

    def __init__(
        self,
        person_query: PersonQueryPort,
        person_command: PersonCommandPort,
        artifact_command: ArtifactCommandPort,
        capture_session_command: CaptureSessionCommandPort,
        transcription: TranscriptionPort,
        model_name: str | None = None,
    ) -> None:
        self._person_query = person_query
        self._person_command = person_command
        self._artifact_command = artifact_command
        self._capture_session_command = capture_session_command
        self._transcription = transcription
        self._agent = build_extraction_agent(model=model_name)

    def ingest_source(self, source: CaptureSource) -> ExtractionResult:
        if source.has_text():
            return self.ingest_text(
                text=source.text or "",
                capture_session_id=source.capture_session_id,
            )
        if source.has_file():
            return self.ingest_file(
                file_path=source.file_path,
                capture_session_id=source.capture_session_id,
            )
        raise ValueError("Capture source needs either text or file_path")

    @observe(
        name="capture.ingest_text",
        as_type="chain",
        capture_input=False,
        capture_output=False,
    )
    def ingest_text(
        self,
        text: str,
        capture_session_id: str | None = None,
    ) -> ExtractionResult:
        transcript = text.strip()
        if not transcript:
            raise ValueError("Text input must not be empty")

        session = self._capture_session_command.create_capture_session(
            transcript=transcript,
            metadata={"source": "text"},
            preferred_id=capture_session_id,
        )
        return self._extract(session.id, session.transcript)

    @observe(
        name="capture.ingest_file",
        as_type="chain",
        capture_input=False,
        capture_output=False,
    )
    def ingest_file(
        self,
        file_path: Path | None,
        capture_session_id: str | None = None,
    ) -> ExtractionResult:
        if file_path is None:
            raise ValueError("file_path is required")
        path = file_path.resolve()
        suffix = path.suffix.lower()

        if suffix in self._TEXT_SUFFIXES:
            text = path.read_text(encoding="utf-8")
            session = self._capture_session_command.create_capture_session(
                transcript=text,
                metadata={"source": "text_file", "path": str(path)},
                preferred_id=capture_session_id,
            )
            return self._extract(session.id, session.transcript)

        if suffix in self._transcription.supported_suffixes():
            transcript = self._transcription.transcribe(path)
            session = self._capture_session_command.create_capture_session(
                transcript=transcript,
                audio_ref=str(path),
                metadata={"source": "audio_file", "path": str(path)},
                preferred_id=capture_session_id,
            )
            return self._extract(session.id, session.transcript)

        raise ValueError(
            f"Unsupported file type '{suffix}'. Supported text: "
            f"{sorted(self._TEXT_SUFFIXES)} and audio: "
            f"{sorted(self._transcription.supported_suffixes())}"
        )

    def ingest_batch(self, sources: list[CaptureSource]) -> list[ExtractionResult]:
        return [self.ingest_source(source) for source in sources]

    def supported_audio_suffixes(self) -> set[str]:
        return self._transcription.supported_suffixes()

    def extract_transcript(
        self,
        *,
        capture_session_id: str,
        transcript: str,
    ) -> ExtractionResult:
        cleaned = transcript.strip()
        if not cleaned:
            raise ValueError("Transcript must not be empty")
        return self._extract(capture_session_id, cleaned)

    @observe(
        name="capture.extract",
        as_type="agent",
        capture_input=False,
        capture_output=False,
    )
    def _extract(
        self,
        capture_session_id: str,
        transcript: str,
    ) -> ExtractionResult:
        set_trace_context(
            trace_name="never-forget.capture",
            session_id=capture_session_id,
            metadata={"capture_session_id": capture_session_id},
            tags=["second_try", "capture_ingestion"],
        )
        deps = AgentDeps(
            capture_session_id=capture_session_id,
            person_query=self._person_query,
            person_command=self._person_command,
            artifact_command=self._artifact_command,
        )
        prompt = (
            f"capture_session_id: {capture_session_id}\n"
            "Extract memories from this transcript:\n"
            f"{transcript}"
        )
        run_result = self._agent.run_sync(prompt, deps=deps)

        output = run_result.output
        if not output.persisted_artifact_ids:
            output.persisted_artifact_ids = deps.persisted_artifact_ids
        if not output.created_person_ids:
            output.created_person_ids = deps.created_person_ids
        if not output.capture_session_id:
            output.capture_session_id = capture_session_id

        return output
