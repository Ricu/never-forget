from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel
from pydantic_ai.messages import ModelMessage


class CaptureSessionStatus(StrEnum):
    PROCESSING_UNDERWAY = "processing_underway"
    INPUT_REQUIRED = "input_required"
    COMPLETE = "complete"
    FAILED = "failed"


class CaptureSession(BaseModel):
    id: str
    source_type: Literal["direct_text"]
    status: CaptureSessionStatus
    transcript: str
    message_history: list[ModelMessage]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def create_for_direct_text(
        cls,
        *,
        transcript: str,
        message_history: list[ModelMessage],
    ) -> CaptureSession:
        now = datetime.now(UTC)
        return cls(
            id=str(uuid4()),
            source_type="direct_text",
            status=CaptureSessionStatus.PROCESSING_UNDERWAY,
            transcript=transcript,
            message_history=message_history,
            created_at=now,
            updated_at=now,
        )

    def with_state(
        self,
        *,
        status: CaptureSessionStatus,
        message_history: list[ModelMessage] | None = None,
    ) -> CaptureSession:
        return self.model_copy(
            update={
                "status": status,
                "message_history": message_history or self.message_history,
                "updated_at": datetime.now(UTC),
            }
        )
