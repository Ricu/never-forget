from pathlib import Path

from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    ToolReturnPart,
    UserPromptPart,
)

from never_forget.application.capture_sessions import CaptureSessionService
from never_forget.domain.capture_sessions import CaptureSessionStatus
from never_forget.infrastructure.sqlite_capture_sessions import SqliteCaptureSessionRepository


def build_repository(tmp_path: Path) -> SqliteCaptureSessionRepository:
    return SqliteCaptureSessionRepository(tmp_path / "capture-sessions.sqlite3")


def test_capture_session_repository_round_trips_pydantic_ai_message_history(
    tmp_path: Path,
) -> None:
    repository = build_repository(tmp_path)
    service = CaptureSessionService(repository=repository)
    message_history = [
        ModelRequest(parts=[UserPromptPart(content="Remember that Anna likes jazz.")]),
        ModelResponse(
            parts=[ToolCallPart(tool_name="extract_memories", args={"text": "Anna likes jazz"})]
        ),
        ModelRequest(
            parts=[
                ToolReturnPart(
                    tool_name="extract_memories",
                    tool_call_id="call-1",
                    content={"memories": []},
                )
            ]
        ),
        ModelResponse(
            parts=[TextPart(content="Saved the note for later review.")], model_name="test"
        ),
    ]

    session = service.create_text_capture_session(
        transcript="Remember that Anna likes jazz.",
        message_history=message_history,
    )
    completed_session = service.complete_capture_session(
        session_id=session.id,
        message_history=message_history,
    )

    reloaded_session = service.get_capture_session(session.id)

    assert completed_session.status is CaptureSessionStatus.COMPLETE
    assert reloaded_session.message_history == message_history


def test_capture_session_view_uses_vercel_ui_message_shape(tmp_path: Path) -> None:
    repository = build_repository(tmp_path)
    service = CaptureSessionService(repository=repository)
    session = service.create_text_capture_session(
        transcript="Call the dentist tomorrow.",
        message_history=[
            ModelRequest(parts=[UserPromptPart(content="Call the dentist tomorrow.")]),
            ModelResponse(
                parts=[TextPart(content="I'll keep that in this capture session.")],
                model_name="test",
            ),
        ],
    )

    view = service.build_capture_session_view(session.id)

    assert view.id == session.id
    assert view.status is CaptureSessionStatus.PROCESSING_UNDERWAY
    assert [message["role"] for message in view.ui_messages] == ["user", "assistant"]
    assert view.ui_messages[0]["parts"][0]["type"] == "text"
    assert view.ui_messages[1]["parts"][0]["text"] == "I'll keep that in this capture session."
