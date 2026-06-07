# Backend Tech Stack

This document records the backend tech stack as it stands, plus the main caveats for the current first version.

## Current Decisions

| Area | Decision | Notes |
| --- | --- | --- |
| Language/runtime | Python 3.12 | Chosen for stability over chasing a newer minor version in the current first version. |
| Package management | `uv` | Repository standard. |
| Backend app surface | FastAPI | Intended next backend interface once the CLI-only stage is replaced by an HTTP API. |
| ASGI server | Uvicorn | Runtime for the FastAPI app. |
| Validation / schemas | Pydantic v2 | Already used in the backend model layer. |
| LLM orchestration | PydanticAI | Current extraction orchestration approach for the current first version. |
| Agent UI protocol | Vercel AI SDK UI data stream protocol | Default protocol for streamed agent interaction between frontend and backend. |
| Agent UI integration | PydanticAI / Vercel AI SDK UI integration | Preferred integration path for exposing FastAPI endpoints as Vercel AI SDK UI data streams. |
| LLM provider | OpenAI | Used for both extraction and transcription in the current first version. |
| Extraction model | `openai:gpt-4.1-mini` | Current default. Can be revisited later based on quality. |
| Transcription model | `whisper-1` | Current default. Can be revisited later based on quality and offline needs. |
| Persistence | SQLite | Primary persistence for the local phase-1 backend. |
| Database access | Raw `sqlite3` + repository layer | Keep it simple in the current first version. |
| Tracing | Langfuse | Part of the stack, not optional. |
| Configuration | `pydantic-settings` later | Current code still uses a custom env loader, but the intended config direction is typed settings. |
| Background jobs | None | Keep the backend synchronous in the current first version. |
| Testing | `pytest` later | Not needed as a formal layer yet. |
| Monitoring | Prometheus later | Not part of the immediate phase-1 backend. |
| ORM / migrations | SQLAlchemy + Alembic later | Explicitly deferred until after the current first version. |
| Containerization | Docker + Docker Compose | Planned infrastructure approach. |
| Authentication | None in the current first version | Local-first and single-user for now. |

## Current-Version Caveats

* The Vercel AI SDK UI data stream protocol is the intended streaming contract, but the current backend does not expose a streaming HTTP endpoint yet.
* SQLite is the right store for the current first version, but the current schema is still evolving, so migration tooling is intentionally deferred.
* OpenAI stays in the loop for the current first version, which means the backend is not fully offline despite the broader product direction.
* The current config approach is transitional. `pydantic-settings` should replace the custom env handling when the HTTP API is introduced.
* Langfuse tracing is part of the backend stack, while service monitoring is intentionally postponed until later.
