from pathlib import Path

import httpx
import pytest
from pydantic_ai.models.test import TestModel

from never_forget.adapters.capture_agent import build_capture_agent
from never_forget.bootstrap import create_app
from never_forget.infrastructure.settings import AppSettings


def build_settings(tmp_path: Path) -> AppSettings:
    return AppSettings(
        capture_session_database_path=tmp_path / "capture-sessions.sqlite3",
    )


def build_stream_request(text: str) -> dict[str, object]:
    return {
        "trigger": "submit-message",
        "id": "request-1",
        "messageId": "user-1",
        "messages": [
            {
                "id": "user-1",
                "role": "user",
                "parts": [
                    {
                        "type": "text",
                        "text": text,
                    }
                ],
            }
        ],
    }


@pytest.mark.anyio
async def test_text_capture_stream_endpoint_persists_completed_capture_session(
    tmp_path: Path,
) -> None:
    capture_agent = build_capture_agent("openai:gpt-4.1-mini")
    settings = build_settings(tmp_path)

    with capture_agent.override(model=TestModel(custom_output_text="Thanks, I captured that.")):
        transport = httpx.ASGITransport(
            app=create_app(settings=settings, capture_agent=capture_agent)
        )
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.post(
                "/api/capture-sessions/text/stream",
                json=build_stream_request("Remember that Anna likes jazz."),
                headers={"Accept": "text/event-stream"},
            )

            session_id = response.headers["x-capture-session-id"]
            session_response = await client.get(f"/api/capture-sessions/{session_id}")

    assert response.status_code == 200
    assert response.headers["x-vercel-ai-ui-message-stream"] == "v1"
    assert '"type":"text-delta"' in response.text

    assert session_response.status_code == 200
    assert session_response.json()["id"] == session_id
    assert session_response.json()["status"] == "complete"
    assert session_response.json()["transcript"] == "Remember that Anna likes jazz."
    assert [message["role"] for message in session_response.json()["ui_messages"]] == [
        "user",
        "assistant",
    ]
    assert (
        session_response.json()["ui_messages"][1]["parts"][0]["text"] == "Thanks, I captured that."
    )


@pytest.mark.anyio
async def test_text_capture_stream_endpoint_rejects_non_text_capture_history(
    tmp_path: Path,
) -> None:
    capture_agent = build_capture_agent("openai:gpt-4.1-mini")
    settings = build_settings(tmp_path)
    transport = httpx.ASGITransport(app=create_app(settings=settings, capture_agent=capture_agent))

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/capture-sessions/text/stream",
            json={
                "trigger": "submit-message",
                "id": "request-1",
                "messageId": "assistant-1",
                "messages": [
                    {
                        "id": "assistant-1",
                        "role": "assistant",
                        "parts": [{"type": "text", "text": "Already answered"}],
                    }
                ],
            },
        )

    assert response.status_code == 422
    assert (
        response.json()["detail"] == "Direct text capture expects exactly one user request message."
    )
