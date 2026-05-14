from __future__ import annotations

from pathlib import Path
from typing import Any

from ag_ui.core import RunAgentInput
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from backend.bootstrap import BackendContainer, build_container
from backend.domain.models import CaptureSession, Memory, Person


class CaptureTextRequest(BaseModel):
    text: str = Field(min_length=1)


class MemoryPatchRequest(BaseModel):
    type: str | None = None
    title: str | None = None
    text: str | None = None
    timeline_at: str | None = None
    person_ids: list[str] | None = None


class CaptureSessionPatchRequest(BaseModel):
    transcript: str = Field(min_length=1)


class PersonCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    aliases: list[str] = Field(default_factory=list)


class PersonPatchRequest(BaseModel):
    name: str | None = None
    aliases: list[str] | None = None


def create_app(container: BackendContainer | None = None) -> FastAPI:
    app = FastAPI(title="Never Forget API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    services = container or build_container()
    app.state.services = services

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/captures")
    async def create_capture(request: Request) -> dict[str, Any]:
        content_type = request.headers.get("content-type", "")
        if content_type.startswith("application/json"):
            payload = CaptureTextRequest.model_validate(await request.json())
            session = services.capture_submission_service.submit_text(payload.text)
            return _serialize_capture_session(request, session, [])

        if content_type.startswith("multipart/form-data"):
            form = await request.form()
            upload = form.get("audio")
            if upload is None or not hasattr(upload, "filename"):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="audio file is required",
                )
            content = await upload.read()
            if not content:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="audio file is empty",
                )
            source = str(form.get("source") or "audio_upload")
            session = services.capture_submission_service.submit_audio(
                filename=upload.filename or "audio.webm",
                content=content,
                source=source,
            )
            return _serialize_capture_session(request, session, [])

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Use application/json for text or multipart/form-data for audio",
        )

    @app.post("/api/ag-ui/capture-runs")
    async def stream_capture_run(request: Request) -> StreamingResponse:
        payload = RunAgentInput.model_validate(await request.json())
        return StreamingResponse(
            services.capture_run_service.stream_run(payload),
            media_type="text/event-stream",
        )

    @app.get("/api/memories")
    def list_memories(
        request: Request, q: str | None = None, type: str | None = None
    ) -> list[dict[str, Any]]:
        memories = services.memory_service.list_memories(query=q, memory_type=type)
        return [
            _serialize_memory(memory, services.person_service) for memory in memories
        ]

    @app.get("/api/memories/{memory_id}")
    def get_memory(memory_id: str) -> dict[str, Any]:
        memory = services.memory_service.get_memory(memory_id)
        if memory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found"
            )
        return _serialize_memory(memory, services.person_service)

    @app.patch("/api/memories/{memory_id}")
    def update_memory(memory_id: str, payload: MemoryPatchRequest) -> dict[str, Any]:
        existing = services.memory_service.get_memory(memory_id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found"
            )

        person_ids = payload.person_ids
        if person_ids is None:
            person_ids = [
                ref.id for ref in existing.linked_entities if ref.type == "person"
            ]
        for person_id in person_ids:
            if services.person_service.get_person(person_id) is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unknown person id: {person_id}",
                )

        updated = services.memory_service.update_memory(
            memory_id,
            type=payload.type or existing.type,
            title=payload.title if payload.title is not None else existing.title,
            text=payload.text or existing.text,
            timeline_at=payload.timeline_at
            if payload.timeline_at is not None
            else existing.timeline_at,
            person_ids=person_ids,
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found"
            )
        return _serialize_memory(updated, services.person_service)

    @app.delete("/api/memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_memory(memory_id: str) -> Response:
        deleted = services.memory_service.delete_memory(memory_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found"
            )
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.get("/api/capture-sessions")
    def list_capture_sessions(request: Request) -> list[dict[str, Any]]:
        sessions = services.capture_session_service.list_capture_sessions()
        all_memories = services.memory_service.list_memories()
        return [
            _serialize_capture_session(request, session, all_memories)
            for session in sessions
        ]

    @app.get("/api/capture-sessions/{capture_session_id}")
    def get_capture_session(
        request: Request, capture_session_id: str
    ) -> dict[str, Any]:
        session = services.capture_session_service.get_capture_session(
            capture_session_id
        )
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Capture session not found",
            )
        related_memories = [
            memory
            for memory in services.memory_service.list_memories()
            if memory.capture_session_id == capture_session_id
        ]
        return _serialize_capture_session(request, session, related_memories)

    @app.patch("/api/capture-sessions/{capture_session_id}")
    def update_capture_session(
        request: Request,
        capture_session_id: str,
        payload: CaptureSessionPatchRequest,
    ) -> dict[str, Any]:
        try:
            updated = services.capture_session_service.update_transcript(
                capture_session_id,
                transcript=payload.transcript,
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Capture session not found",
            )
        related_memories = [
            memory
            for memory in services.memory_service.list_memories()
            if memory.capture_session_id == capture_session_id
        ]
        return _serialize_capture_session(request, updated, related_memories)

    @app.delete(
        "/api/capture-sessions/{capture_session_id}",
        status_code=status.HTTP_204_NO_CONTENT,
    )
    def delete_capture_session(capture_session_id: str) -> Response:
        deleted = services.capture_session_service.delete_capture_session(
            capture_session_id
        )
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Capture session not found",
            )
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.get(
        "/api/capture-sessions/{capture_session_id}/audio", name="get_capture_audio"
    )
    def get_capture_audio(capture_session_id: str) -> FileResponse:
        session = services.capture_session_service.get_capture_session(
            capture_session_id
        )
        if session is None or not session.audio_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found"
            )
        path = Path(session.audio_ref)
        if not path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found"
            )
        return FileResponse(path)

    @app.get("/api/persons")
    def list_persons(q: str | None = None) -> list[dict[str, Any]]:
        persons = services.person_service.list_persons(query=q)
        return [
            _serialize_person(person, services.person_service) for person in persons
        ]

    @app.get("/api/persons/{person_id}")
    def get_person(person_id: str) -> dict[str, Any]:
        person = services.person_service.get_person(person_id)
        if person is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Person not found"
            )
        return _serialize_person(person, services.person_service, include_memories=True)

    @app.post("/api/persons", status_code=status.HTTP_201_CREATED)
    def create_person(payload: PersonCreateRequest) -> dict[str, Any]:
        person = services.person_service.create_person(
            name=payload.name,
            aliases=payload.aliases,
        )
        return _serialize_person(person, services.person_service)

    @app.patch("/api/persons/{person_id}")
    def update_person(person_id: str, payload: PersonPatchRequest) -> dict[str, Any]:
        existing = services.person_service.get_person(person_id)
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Person not found"
            )
        updated = services.person_service.update_person(
            person_id,
            name=payload.name or existing.name,
            aliases=payload.aliases
            if payload.aliases is not None
            else existing.aliases,
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Person not found"
            )
        return _serialize_person(updated, services.person_service)

    return app


def _serialize_memory(memory: Memory, person_service: Any) -> dict[str, Any]:
    linked_people = []
    for ref in memory.linked_entities:
        if ref.type != "person":
            continue
        person = person_service.get_person(ref.id)
        if person is None:
            continue
        linked_people.append(
            {"id": person.id, "name": person.name, "aliases": person.aliases}
        )
    return {
        **memory.model_dump(mode="json"),
        "linkedPersons": linked_people,
    }


def _serialize_capture_session(
    request: Request,
    session: CaptureSession,
    memories: list[Memory],
) -> dict[str, Any]:
    audio_url = None
    if request.scope.get("router") is not None and session.audio_ref:
        audio_url = str(
            request.url_for("get_capture_audio", capture_session_id=session.id)
        )
    elif session.audio_ref:
        audio_url = f"/api/capture-sessions/{session.id}/audio"

    related_memories = [
        memory for memory in memories if memory.capture_session_id == session.id
    ]
    return {
        **session.model_dump(mode="json"),
        "audioUrl": audio_url,
        "memories": [
            _serialize_memory(memory, request.app.state.services.person_service)
            if hasattr(request.app.state, "services")
            else memory.model_dump(mode="json")
            for memory in related_memories
        ],
    }


def _serialize_person(
    person: Person,
    person_service: Any,
    *,
    include_memories: bool = False,
) -> dict[str, Any]:
    payload = person.model_dump(mode="json")
    if include_memories:
        payload["memories"] = [
            _serialize_memory(memory, person_service)
            for memory in person_service.memories_for_person(person.id)
        ]
    return payload
