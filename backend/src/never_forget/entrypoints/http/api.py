from __future__ import annotations

import json
from http import HTTPStatus

from fastapi import APIRouter, HTTPException
from fastapi.requests import Request
from fastapi.responses import JSONResponse, Response
from pydantic import ValidationError
from pydantic_ai import Agent
from pydantic_ai.agent import AgentRunResult
from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

from never_forget.application.capture_sessions import (
    CaptureSessionNotFoundError,
    CaptureSessionService,
    CaptureSessionView,
)
from never_forget.application.health_check import HealthCheckService


def build_api_router(
    *,
    health_check_service: HealthCheckService,
    capture_session_service: CaptureSessionService,
    capture_agent: Agent[None, str],
    api_prefix: str,
) -> APIRouter:
    router = APIRouter(prefix=api_prefix)

    @router.get("/health")
    def health() -> dict[str, str]:
        return health_check_service.run().to_dict()

    @router.get("/capture-sessions/{session_id}", response_model=CaptureSessionView)
    def get_capture_session(session_id: str) -> CaptureSessionView:
        try:
            return capture_session_service.build_capture_session_view(session_id)
        except CaptureSessionNotFoundError as error:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND, detail="Capture session not found"
            ) from error

    @router.post("/capture-sessions/text/stream")
    async def stream_text_capture_session(request: Request) -> Response:
        body = await request.body()
        try:
            run_input = VercelAIAdapter.build_run_input(body)
        except ValidationError as error:
            return JSONResponse(
                status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
                content=json.loads(error.json()),
            )

        initial_message_history = VercelAIAdapter.load_messages(run_input.messages)
        transcript = _extract_direct_text_transcript(initial_message_history)
        session = capture_session_service.create_text_capture_session(
            transcript=transcript,
            message_history=initial_message_history,
        )
        adapter = VercelAIAdapter(
            agent=capture_agent,
            run_input=run_input,
            accept=request.headers.get("accept"),
        )

        async def on_complete(result: AgentRunResult[str]) -> None:
            capture_session_service.complete_capture_session(
                session_id=session.id,
                message_history=result.all_messages(),
            )

        async def stream():
            try:
                async for event in adapter.run_stream(on_complete=on_complete):
                    yield event
            except Exception:
                capture_session_service.fail_capture_session(session_id=session.id)
                raise

        response = adapter.streaming_response(stream())
        response.headers["X-Capture-Session-Id"] = session.id
        return response

    return router


def _extract_direct_text_transcript(message_history: list[ModelMessage]) -> str:
    if len(message_history) != 1 or not isinstance(message_history[0], ModelRequest):
        raise HTTPException(
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            detail="Direct text capture expects exactly one user request message.",
        )

    user_prompt_parts = [
        part for part in message_history[0].parts if isinstance(part, UserPromptPart)
    ]
    if len(user_prompt_parts) != 1:
        raise HTTPException(
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            detail="Direct text capture expects exactly one user prompt part.",
        )

    user_prompt = user_prompt_parts[0]
    if not isinstance(user_prompt.content, str):
        raise HTTPException(
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            detail="Direct text capture does not support non-text prompt content.",
        )

    transcript = user_prompt.content.strip()
    if transcript == "":
        raise HTTPException(
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
            detail="Direct text capture requires non-empty text.",
        )

    return transcript
