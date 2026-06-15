# Issue #4 Frontend Handover

This note is for the frontend part of issue `#4` after the backend slice landed on branch `codex/review-issue-4-architecture`.

Relevant backend commits:

- `d46a53d` - persistence core for `capture sessions`
- `9e72d22` - streamed text capture endpoint

Relevant backend files:

- [backend/src/never_forget/entrypoints/http/api.py](C:/code/never-forget/backend/src/never_forget/entrypoints/http/api.py)
- [backend/src/never_forget/application/capture_sessions.py](C:/code/never-forget/backend/src/never_forget/application/capture_sessions.py)
- [backend/src/never_forget/domain/capture_sessions.py](C:/code/never-forget/backend/src/never_forget/domain/capture_sessions.py)
- [backend/tests/test_capture_session_stream_api.py](C:/code/never-forget/backend/tests/test_capture_session_stream_api.py)

## Backend contract

### Stream endpoint

- `POST /api/capture-sessions/text/stream`
- Transport: Vercel AI SDK UI data stream protocol via PydanticAI `VercelAIAdapter`
- Response header: `X-Capture-Session-Id`
- Response header: `x-vercel-ai-ui-message-stream: v1`

### Read endpoint

- `GET /api/capture-sessions/{session_id}`
- Returns:
  - `id`
  - `source_type`
  - `status`
  - `transcript`
  - `created_at`
  - `updated_at`
  - `ui_messages`

`ui_messages` is already in a Vercel/AI SDK UI-style message shape, produced via `VercelAIAdapter.dump_messages(...)`.

## Important limitation of the current slice

The stream endpoint currently supports only the first direct-text capture submission.

That means the request must represent one fresh user message only:

- one `submit-message` request
- one user message
- one text part
- no assistant history
- no tool history
- no continuation/resume of an existing session yet

If the frontend sends anything else, the backend rejects it with `422`.

## Practical frontend implication

For this slice, the capture page should treat the stream endpoint as:

- create new `capture session`
- stream the first assistant response
- read the resulting `session_id` from `X-Capture-Session-Id`
- navigate to the unified `capture session` view for that new session

Do not try to use this endpoint yet for reopening or continuing an old session.

## Suggested frontend flow

### Capture surface

- Add a text input and submit action on the `capture` page.
- Use AI SDK UI transport against `/api/capture-sessions/text/stream`.
- Submit one fresh user message containing only the typed text.

### Session routing

- After the POST starts, read `X-Capture-Session-Id` from the response.
- Navigate to a new capture-session route as soon as the ID is known.
- Suggested route shape: `/sessions/:sessionId` or similar.

### Unified capture-session view

- While the initial stream is active, render the AI SDK UI messages directly from the stream.
- After reload / revisit, fetch `GET /api/capture-sessions/{session_id}` and hydrate from `ui_messages`.
- Also render:
  - `status`
  - `transcript`

### Error handling

- If submit returns `422`, treat it as a client-shape problem, not a generic server failure.
- If stream fails after the session was created, the backend marks the session as `failed`.
- The session detail route should therefore handle `failed` as a visible state.

## Things the frontend should not assume yet

- no resume-stream endpoint for an existing `capture session`
- no persisted extracted memories in this slice
- no review-queue-specific UI behavior yet
- no deferred tool approval flow yet
- no multi-message continuation flow yet

## Recommended frontend tasks

1. Replace the `capture` placeholder with a minimal text capture form.
2. Introduce a dedicated capture-session route and page.
3. Hook AI SDK UI streaming to `/api/capture-sessions/text/stream`.
4. Capture `X-Capture-Session-Id` and route into the session page.
5. Load persisted session state from `GET /api/capture-sessions/{session_id}` on revisit.
6. Render `ui_messages` without inventing a parallel message format.

## Open follow-up after frontend lands

Once the first end-to-end text flow is working, the next backend/frontend seam to clarify is continuation of an existing `capture session` versus initial creation. The current backend deliberately avoids solving that yet.
