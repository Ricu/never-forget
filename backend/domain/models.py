from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class LinkedEntityRef(BaseModel):
    type: str = Field(
        min_length=1,
        description=(
            "Stable entity type referenced by the memory. Use `person` for "
            "all current links."
        ),
    )
    id: str = Field(
        min_length=1,
        description="Identifier of the linked stable entity.",
    )


class ArtifactInput(BaseModel):
    type: str = Field(
        min_length=1,
        description=(
            "Memory type for this extracted artifact. Prefer one of: "
            "`moment`, `friend_note`, `idea`, `todo`, `symptom`, or "
            "`miscellaneous`."
        ),
    )
    text: str = Field(
        min_length=1,
        description=(
            "Readable memory text that preserves the user's meaning, wording, "
            "and language while removing obvious filler."
        ),
    )
    title: str | None = Field(
        default=None,
        description="Optional short title when it improves scanability.",
    )
    linked_entities: list[LinkedEntityRef] = Field(
        default_factory=list,
        description=(
            "Stable entities referenced by this memory. Currently only person "
            "links are supported."
        ),
    )
    timeline_at: datetime | date | str | None = Field(
        default=None,
        description=(
            "Event time only when the memory belongs to a different time than "
            "the capture session."
        ),
    )


class CaptureSession(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    audio_ref: str | None = None
    transcript: str
    transcript_segments: list[dict[str, Any]] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class Person(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    aliases: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class Memory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    capture_session_id: str
    type: str
    text: str
    title: str | None = None
    linked_entities: list[LinkedEntityRef] = Field(default_factory=list)
    timeline_at: datetime | date | str | None = None
    created_at: datetime
    updated_at: datetime


class ExtractionResult(BaseModel):
    capture_session_id: str = Field(
        default="",
        description="Capture session processed by this extraction run.",
    )
    persisted_artifact_ids: list[str] = Field(
        default_factory=list,
        description="IDs returned from the single `ingest_artifacts` call.",
    )
    created_person_ids: list[str] = Field(
        default_factory=list,
        description="IDs of any new persons created while extracting memories.",
    )
    notes: str | None = Field(
        default=None,
        description="Optional short note for exceptional extraction cases.",
    )


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"
