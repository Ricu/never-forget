# Backend Rules

These rules apply to code under `backend/`.

## PydanticAI message model

- When persisting or passing agent interaction history, use PydanticAI's native message model (`ModelMessage`, `ModelRequest`, `ModelResponse`, and their parts) as the reference shape.
- Do not flatten the interaction into a simplified `role + text` schema if that would lose structure needed for tool calling.
- Be explicit about the distinction between:
  - `ToolCallPart` inside `ModelResponse`
  - `ToolReturnPart` inside `ModelRequest`
  - `ThinkingPart` inside `ModelResponse`
- If a backend-facing DTO or persistence shape is introduced, it must preserve enough structure to round-trip the message history without losing tool-call semantics.

## UI transport

- Do not hand-roll the Vercel AI SDK UI data stream protocol when PydanticAI's built-in UI transport support is sufficient.
- Prefer `pydantic_ai.ui.vercel_ai.VercelAIAdapter` for FastAPI / Starlette endpoints that stream agent interaction to the frontend.
- Treat the adapter as the transport seam:
  - backend application code owns the agent run and server-side state
  - the adapter owns protocol translation to and from AI SDK UI
- If stricter conversation integrity is needed, persist authoritative message history server-side keyed by the capture session ID and pass that history to the adapter instead of trusting caller-submitted history.
