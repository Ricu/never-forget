from pydantic_ai import Agent


def build_capture_agent(model: str) -> Agent[None, str]:
    return Agent(
        model,
        instructions=(
            "You are the capture-session assistant for Never Forget. "
            "Respond briefly to acknowledge the captured text and indicate that "
            "more extraction behavior will arrive later."
        ),
        defer_model_check=True,
        name="capture_session_agent",
    )
