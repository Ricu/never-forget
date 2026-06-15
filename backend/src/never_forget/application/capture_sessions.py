from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from pydantic import BaseModel
from pydantic_ai.messages import ModelMessage
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

from never_forget.domain.capture_sessions import CaptureSession, CaptureSessionStatus


class CaptureSessionNotFoundError(Exception):
    pass


class CaptureSessionRepository(Protocol):
    def create(self, session: CaptureSession) -> CaptureSession: ...

    def get(self, session_id: str) -> CaptureSession | None: ...

    def update(self, session: CaptureSession) -> CaptureSession: ...


class CaptureSessionView(BaseModel):
    id: str
    source_type: str
    status: CaptureSessionStatus
    transcript: str
    created_at: str
    updated_at: str
    ui_messages: list[dict[str, Any]]


@dataclass(slots=True)
class CaptureSessionService:
    repository: CaptureSessionRepository

    def create_text_capture_session(
        self,
        *,
        transcript: str,
        message_history: list[ModelMessage],
    ) -> CaptureSession:
        session = CaptureSession.create_for_direct_text(
            transcript=transcript,
            message_history=message_history,
        )
        return self.repository.create(session)

    def get_capture_session(self, session_id: str) -> CaptureSession:
        session = self.repository.get(session_id)
        if session is None:
            raise CaptureSessionNotFoundError(session_id)
        return session

    def complete_capture_session(
        self,
        *,
        session_id: str,
        message_history: list[ModelMessage],
    ) -> CaptureSession:
        session = self.get_capture_session(session_id)
        updated_session = session.with_state(
            status=CaptureSessionStatus.COMPLETE,
            message_history=message_history,
        )
        return self.repository.update(updated_session)

    def fail_capture_session(self, *, session_id: str) -> CaptureSession:
        session = self.get_capture_session(session_id)
        failed_session = session.with_state(status=CaptureSessionStatus.FAILED)
        return self.repository.update(failed_session)

    def build_capture_session_view(self, session_id: str) -> CaptureSessionView:
        session = self.get_capture_session(session_id)
        ui_messages = [
            message.model_dump(mode="json", by_alias=True)
            for message in VercelAIAdapter.dump_messages(session.message_history)
        ]
        return CaptureSessionView(
            id=session.id,
            source_type=session.source_type,
            status=session.status,
            transcript=session.transcript,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
            ui_messages=ui_messages,
        )
