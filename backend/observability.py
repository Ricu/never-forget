from __future__ import annotations

from langfuse import get_client, observe
from pydantic_ai.agent import Agent

_instrumented = False


def setup_instrumentation() -> None:
    global _instrumented
    if _instrumented:
        return
    Agent.instrument_all()
    _instrumented = True


def flush_traces() -> None:
    get_client().flush()


def set_trace_context(
    *,
    trace_name: str | None = None,
    session_id: str | None = None,
    metadata: dict | None = None,
    tags: list[str] | None = None,
) -> None:
    get_client().update_current_trace(
        name=trace_name,
        session_id=session_id,
        metadata=metadata,
        tags=tags,
    )


__all__ = ["observe", "setup_instrumentation", "flush_traces", "set_trace_context"]
