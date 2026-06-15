# Issue #4 Frontend Handover, Round 2

This note captures the current frontend slice state after the first implementation pass for issue `#4`.

This is **not canon**. It is a working handover for continuing refinement in a new session.

It assumes the backend contract described in [docs/draft/20260614_issue4_frontend_handover.md](C:/code/never-forget/docs/draft/20260614_issue4_frontend_handover.md) is still the reference point.

## Current outcome

The frontend now has a first end-to-end text capture slice:

- `/capture` is no longer a placeholder.
- The capture interface has a prompt input and submit action.
- A fresh submission routes into a dedicated capture-session view.
- The capture-session view renders an agent-style thread using `ai-elements`.
- The thread renderer supports:
  - normal text message parts
  - reasoning parts
  - tool calls / tool outputs via `Tool`
  - step boundaries
  - basic file / source parts
- Existing sessions can be revisited through `GET /api/capture-sessions/{session_id}`.
- Build and typecheck pass.

## Important implementation decision

There is one architectural decision that differs slightly from the earlier verbal framing:

- The user still starts on `/capture`.
- On submit, the app navigates immediately into `/sessions/new`.
- The **actual live stream is owned by the session route**, not by the capture route.

Why this was done:

- It keeps the live `useChat` instance anchored to the route that is actually rendering the session thread.
- It avoids trying to transfer a live stream object or live AI SDK state across route boundaries.
- It still preserves the user-facing flow we wanted:
  - type on capture surface
  - immediately enter capture session view
  - see first user message plus pending/streaming assistant state there

So the route model is:

- `/capture` = input surface
- `/sessions/new` = transient startup route for a new session
- `/sessions/:sessionId` = stable session route once `X-Capture-Session-Id` is known

## Files added / changed

### New app-specific slice files

- [webapp/src/features/capture/components/capture-composer-card.tsx](C:/code/never-forget/webapp/src/features/capture/components/capture-composer-card.tsx)
- [webapp/src/features/sessions/routes/session-page.tsx](C:/code/never-forget/webapp/src/features/sessions/routes/session-page.tsx)
- [webapp/src/features/sessions/components/session-page-header.tsx](C:/code/never-forget/webapp/src/features/sessions/components/session-page-header.tsx)
- [webapp/src/features/sessions/components/session-state-notice.tsx](C:/code/never-forget/webapp/src/features/sessions/components/session-state-notice.tsx)
- [webapp/src/features/sessions/components/session-thread.tsx](C:/code/never-forget/webapp/src/features/sessions/components/session-thread.tsx)
- [webapp/src/features/sessions/components/message-parts-renderer.tsx](C:/code/never-forget/webapp/src/features/sessions/components/message-parts-renderer.tsx)
- [webapp/src/features/sessions/lib/session-navigation.ts](C:/code/never-forget/webapp/src/features/sessions/lib/session-navigation.ts)
- [webapp/src/shared/api/capture-sessions.ts](C:/code/never-forget/webapp/src/shared/api/capture-sessions.ts)

### Existing app files changed

- [webapp/src/app/providers.tsx](C:/code/never-forget/webapp/src/app/providers.tsx)
- [webapp/src/app/router.tsx](C:/code/never-forget/webapp/src/app/router.tsx)
- [webapp/src/features/capture/routes/capture-page.tsx](C:/code/never-forget/webapp/src/features/capture/routes/capture-page.tsx)

### AI Elements and generated shared UI files added

`ai-elements` and related shadcn-style primitives were generated into:

- [webapp/src/components/ai-elements](C:/code/never-forget/webapp/src/components/ai-elements)
- [webapp/src/shared/ui](C:/code/never-forget/webapp/src/shared/ui)

This includes things like:

- `conversation.tsx`
- `message.tsx`
- `tool.tsx`
- `prompt-input.tsx`
- `button-group.tsx`
- `tooltip.tsx`
- `collapsible.tsx`
- `input-group.tsx`
- etc.

## What each main file does

### Capture surface

#### [webapp/src/features/capture/components/capture-composer-card.tsx](C:/code/never-forget/webapp/src/features/capture/components/capture-composer-card.tsx)

Purpose:

- The new visual capture surface.
- Uses `PromptInput` from `ai-elements`.
- Uses `react-hook-form` + `zod` for minimal validation.
- Produces a single direct-text submission.

Notes:

- The page is intentionally opinionated visually:
  - one large card
  - signal-line / glow treatment
  - quiet explanatory copy
- The component does **not** stream directly.
- It only validates and calls `onStartCapture(text)`.

#### [webapp/src/features/capture/routes/capture-page.tsx](C:/code/never-forget/webapp/src/features/capture/routes/capture-page.tsx)

Purpose:

- Route-level wrapper for the capture interface.
- Navigates to `/sessions/new` with route state carrying the initial prompt.

Notes:

- This is the thin route, by design.
- It also includes a small explanatory card describing current slice constraints.

### Session route

#### [webapp/src/features/sessions/routes/session-page.tsx](C:/code/never-forget/webapp/src/features/sessions/routes/session-page.tsx)

Purpose:

- Orchestrates the full capture-session view.
- Owns the live `useChat` instance for new submissions.
- Owns persisted session loading with TanStack Query.

Key behavior:

- Reads transient route state for `/sessions/new`.
- Creates a `DefaultChatTransport` pointing at:
  - `POST /api/capture-sessions/text/stream`
- Uses a custom `fetch` inside the transport to read:
  - `X-Capture-Session-Id`
- Once the header arrives:
  - stores the real session id
  - replaces `/sessions/new` with `/sessions/:sessionId`
- On revisit:
  - fetches `GET /api/capture-sessions/{sessionId}`
- Decides whether to display:
  - live streamed messages
  - persisted `ui_messages`
- Builds visible session-state notices for:
  - invalid `/sessions/new` entry
  - start failure
  - stream interruption
  - persisted failed session
  - persisted processing state
  - session load failure

Important detail:

- `showLiveMessages` is intentionally permissive while the new session is being created.
- This keeps the first user message and pending assistant row visible immediately.

### Session UI pieces

#### [webapp/src/features/sessions/components/session-page-header.tsx](C:/code/never-forget/webapp/src/features/sessions/components/session-page-header.tsx)

Purpose:

- Quiet session header.
- Back link to capture.
- Small metadata chip showing the capture interface type.
- If available, shows a shortened session id.

This follows the earlier alignment:

- no always-visible explicit status field
- metadata is secondary

#### [webapp/src/features/sessions/components/session-thread.tsx](C:/code/never-forget/webapp/src/features/sessions/components/session-thread.tsx)

Purpose:

- Wraps the thread inside `Conversation`.
- Renders empty state if needed.
- Renders all message rows through `MessagePartsRenderer`.
- Adds a pending assistant row for the `creating/connecting` state.

This is the main visual surface of the slice.

#### [webapp/src/features/sessions/components/message-parts-renderer.tsx](C:/code/never-forget/webapp/src/features/sessions/components/message-parts-renderer.tsx)

Purpose:

- This is the main seam between backend `ui_messages` / AI SDK messages and the rendered UI.

Current handling:

- `text` -> `MessageResponse`
- `reasoning` -> dashed reasoning block
- `tool-*` and `dynamic-tool` -> `Tool`, `ToolHeader`, `ToolInput`, `ToolOutput`
- `step-start` -> visual separator row
- `file`, `source-url`, `source-document` -> lightweight chips/links

Important:

- Tool calls are treated as **tool UI parts**, not normal messages.
- This matches the design decision discussed with the user.

#### [webapp/src/features/sessions/components/session-state-notice.tsx](C:/code/never-forget/webapp/src/features/sessions/components/session-state-notice.tsx)

Purpose:

- Inline status/error communication for the session flow.

Naming note:

- This is intentionally called `SessionStateNotice`.
- We explicitly avoided `feedback` because that could be confused with user rating feedback.

### Shared slice helpers

#### [webapp/src/shared/api/capture-sessions.ts](C:/code/never-forget/webapp/src/shared/api/capture-sessions.ts)

Purpose:

- Defines the frontend view of the capture-session payload.
- Contains `getCaptureSession(sessionId)`.

#### [webapp/src/features/sessions/lib/session-navigation.ts](C:/code/never-forget/webapp/src/features/sessions/lib/session-navigation.ts)

Purpose:

- Encodes the transient `/sessions/new` route model.
- Holds the route-state type guard and builder.

## Router / provider changes

### [webapp/src/app/router.tsx](C:/code/never-forget/webapp/src/app/router.tsx)

Added:

- `/sessions/:sessionId`

The old `/sessions` placeholder route still exists.

That means current route structure is:

- `/capture`
- `/review-queue`
- `/sessions`
- `/sessions/:sessionId`
- `/memory-overview`

### [webapp/src/app/providers.tsx](C:/code/never-forget/webapp/src/app/providers.tsx)

Added:

- `TooltipProvider`

This was needed because generated `ai-elements` / shared-ui components rely on it.

## Dependency and generator setup

### What was added to `package.json`

Relevant runtime additions in [webapp/package.json](C:/code/never-forget/webapp/package.json):

- `ai`
- `@ai-sdk/react`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`

And a large set of `ai-elements` / generated-component dependencies, such as:

- `streamdown`
- `use-stick-to-bottom`
- `cmdk`
- `shiki`
- `tw-animate-css`
- etc.

### Important AI Elements note

Do **not** install `ai-elements` as a normal app dependency.

Correct pattern:

```powershell
pnpm dlx ai-elements@latest add conversation message tool prompt-input
```

This repo now contains the generated component code locally.

### Important `components.json` note

[webapp/components.json](C:/code/never-forget/webapp/components.json) was changed so generation targets the repo’s actual directories:

- `components` -> `src/components`
- `ui` -> `src/shared/ui`
- etc.

However, there is still a subtle generator mismatch:

- the generator emitted imports like `src/shared/ui/button`
- Vite only resolves `@/...`, not bare `src/...`

So after generation, those imports had to be manually normalized to `@/shared/...`.

This is currently one of the most important traps in the worktree.

## Known generator / worktree weirdness

### 1. Stray `webapp/@/...` deletions in git status

Current `git status` shows deleted files:

- `webapp/@/components/ui/button.tsx`
- `webapp/@/lib/utils.ts`

These were accidental outputs from an earlier bad generator alias configuration.

Interpretation:

- they are not part of the intended final structure
- they should likely remain deleted / removed from the repo if they are currently tracked

But:

- handle them carefully in the next session
- verify whether they were ever intentionally committed or are just accidental tracked leftovers

### 2. `dev.out` / `dev.err`

Current status also shows:

- `webapp/dev.out`
- `webapp/dev.err`

These are just temporary dev-server output files from local verification attempts and can be deleted.

### 3. Generated shared-ui files partially overlapped existing ones

Some primitives already existed before generation, notably:

- `button.tsx`
- `separator.tsx`

They were overwritten / updated to generator-style versions.

That is fine for now because build passes, but if refinement happens later, it is worth checking whether those changes are desirable from the design-system perspective.

## Validation status

These commands passed:

```powershell
cd C:\code\never-forget\webapp
pnpm run typecheck -- --pretty false
npm run build
pnpm test
```

At least one HTTP check also confirmed the dev server route responded with `200` after the import alias fix.

What I did **not** fully complete:

- a proper browser-driven visual QA pass through the app
- an actual manual end-to-end submit against the backend in-browser

So the state is:

- compile/build/test verified
- not yet fully visually / interaction verified in-browser end-to-end

## UX / visual direction currently implemented

This matches the direction the user and agent aligned on:

- capture session view is **thread first**
- no explicit permanent status field in the header
- metadata is secondary and quiet
- transcript is not separately duplicated for now
- pending / creating state is shown as:
  - first user message visible
  - assistant row present in loading form
- tool calls render as dedicated collapsible tool UI, not as plain messages

## Remaining questions / likely next refinement areas

### 1. `/sessions/new` route model

The current approach is pragmatic and works architecturally, but it may still want refinement:

- Is `/sessions/new` acceptable as a transient route?
- Would the human rather have a different URL shape?
- Is there a better way to express “new session is being created” without a sentinel route?

### 2. Error handling copy and distinctions

Current notice model is intentionally simple:

- invalid entry into `/sessions/new`
- start failure
- stream interruption
- persisted failed session
- load failure

This is probably good enough for the slice, but it may want copy refinement and possibly more specific `422` handling.

### 3. Session revisit behavior

Current logic prefers:

- live messages while a new stream is underway
- persisted `ui_messages` when revisiting or when no live messages are active

This is fine for the slice, but it would be good to manually verify:

- initial navigation timing
- refresh mid-stream
- refresh after completion

### 4. Generated component surface is large

The AI Elements generation brought in a lot of code and dependencies.

This is not necessarily bad, but it creates follow-up questions:

- Do we keep the full generated surface?
- Do we trim unused generated primitives?
- Do we want to standardize how generated files should import internal utilities and UI primitives?

### 5. `components.json` may still not be ideal

It was changed to:

- target the real folders

But the generator still produced imports that needed manual correction.

So next session should decide whether to:

- keep current `components.json` and accept manual import normalization after generation
- or find a better config that avoids this mismatch entirely

## Suggested next-session checklist

1. Clean temporary worktree noise:
   - inspect the deleted `webapp/@/...` files
   - delete `webapp/dev.out`
   - delete `webapp/dev.err`

2. Run the app locally:

```powershell
cd C:\code\never-forget\webapp
pnpm dev -- --host 127.0.0.1 --port 4173
```

3. Verify the core flow manually against the backend:
   - open `/capture`
   - type text
   - submit
   - confirm immediate navigation into session view
   - confirm pending assistant row appears
   - confirm streamed response appears
   - refresh and confirm persisted session loads

4. Refine visuals:
   - capture card spacing / typography
   - session thread spacing
   - tool block hierarchy
   - notice styles and copy

5. Decide whether to keep or adjust:
   - `/sessions/new` route
   - current `components.json`
   - breadth of generated UI primitives checked into the repo

## Fast mental model for a new session

If a fresh agent needs the shortest correct map:

- Backend supports only first direct-text capture submission.
- Frontend now uses `/capture` -> `/sessions/new` -> `/sessions/:sessionId`.
- `SessionPage` owns `useChat`.
- Session persistence uses TanStack Query via `getCaptureSession`.
- `MessagePartsRenderer` is the key seam for rendering AI SDK `ui_messages`.
- AI Elements are locally generated, not installed as a standalone app dependency.
- Generated import paths had to be corrected from `src/...` to `@/...`.
- Build passes, but the UI still needs refinement and manual in-browser verification.

