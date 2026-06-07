# App Structure Variant A: Capture Console

This variant treats Never Forget as a calm, capture-first desktop app. The first screen exists mainly to get information out of the user's head quickly. Review, memories, sessions, contacts, and todos are always nearby, but they do not compete with capture.

The app feels like a private command center for personal memory. It is not a dashboard full of metrics. It is also not a chat app. The main rhythm is:

1. Capture something quickly.
2. Watch or ignore the processing run.
3. Review unresolved or unreviewed sessions later.
4. Browse memories, sessions, contacts, and todos when needed.

## Shell Model

The app uses a persistent left sidebar and a single main content area.

The sidebar has three conceptual zones:

- App identity at the top: `Never Forget`.
- Primary navigation: Capture, Review, Memories, Sessions, Contacts, ToDos.
- A compact review queue preview below navigation.

There is no account block in the bottom-left corner for Stage 1. The bottom of the sidebar can stay empty or hold low-priority app utilities later.

The review queue is visible from anywhere as a small list of unreviewed capture sessions. It behaves similarly to a conversation list in assistant apps, but the entries are capture sessions rather than chats. Each row should use the timestamp as its main label for now. Generated labels may become useful later, but the product does not yet know what good labels would be.

Sidebar queue rows do not need to show input type. They should show state, but state should stay subtle. Failed, waiting-for-input, and unreviewed-complete sessions should be distinguishable through small wording, icon, or muted metadata rather than strong color coding. The sidebar should not make the app feel like an urgent task manager.

The main content area changes based on selected page. It should usually have one primary work surface, not many dashboard cards.

## Page Map

- Capture
- Active Run
- Review Queue
- Review Session Detail
- Memories
- Memory Detail
- Sessions
- Capture Session Detail
- Contacts
- Person Detail
- ToDos
- ToDo Detail

Future pages, not Stage 1:

- Assisted Retrieval
- Timeline
- Global Time Travel
- Contact Merge / Deduplication

## Screen: Capture

Purpose: Provide the lowest-friction way to submit text, uploaded audio, or a new voice recording.

Primary user action: Enter or record something that should be remembered.

What it looks like:

The screen starts directly with the capture surface. There is no hero section, no onboarding copy, and no dashboard. The content is centered with enough empty space around it to make capture feel focused. The top of the main area has a small title such as `Capture` and a short hint that all supported input modes lead to the same pipeline.

The primary element is a prompt-style input. It supports typed text, audio upload, and voice recording in one place. Voice recording is not a separate page or modal. It is a first-class mode of the same capture surface.

Below the input, a subtle row shows operational hints:

- whether audio can be dropped onto the page
- whether a capture is currently processing
- how many sessions need review

Below or near this utility row, there may be a small `Review immediately` switch. When off, submission keeps the user on the calm capture screen and the session simply appears in the review queue. When on, submission takes the user directly to the Active Run screen so they can watch the incoming stream and inspect what the agent is doing.

The review count is informational, not a task list. The actual queue remains in the sidebar and on the Review page.

Key states:

- Empty: ready for text, upload, or recording.
- Typing: text input expands enough to handle a short or medium note.
- Recording: the input area becomes an active recorder with elapsed time and stop/cancel controls.
- Audio attached: the selected file or recording is shown as pending input before submission.
- Review immediately off: submit and stay in capture context.
- Review immediately on: submit and navigate into the Active Run screen.
- Submitting: input is locked enough to prevent duplicate submission.
- Failed to submit: the input is preserved so the user can retry.

## Screen: Active Run

Purpose: Show what is happening after a capture session is created.

Primary user action: Watch progress, then either inspect results or leave them for later review.

What it looks like:

This screen appears after submission when `Review immediately` is active, or when the user opens a capture session whose processing run they want to inspect. It must be possible to enter the screen at any time: at the beginning of the stream, in the middle of the stream, or after the stream has completed. The same screen should render the current state from persisted run/session data rather than assuming the user was present from the start.

The top area should stay small. It can show timestamp, current run state, and a compact route back to the review/session context. Input type should preferably be visible from the content itself rather than repeated as metadata. For example, a user bubble can contain an audio attachment, uploaded file, image, or text input.

The main area should behave like a typical agent/chat interaction, using AI Elements-style components. The user input appears as one or more user bubbles with timestamp information. The agent output streams as assistant messages, including deltas and tool-call-like activity where useful. This is appropriate because an actual agent is running in the background.

The screen should avoid turning every internal backend step into a separate visible event. For example, transcription does not need explicit "started" and "completed" rows. If the input was audio, the user bubble can show the audio input, and the transcribed text can appear below or near it once available. The interface should make the run understandable without becoming a verbose process log.

Artifacts may appear in a subtle result area, but this area should not dominate the chat stream by default. A good direction is a compact collapsed section such as "Extracted memories" that can expand when the user wants to inspect details. Later, custom components can make this richer: artifact previews, human-in-the-loop questions, audio-plus-transcript displays, or dedicated cards for extracted memories and linked persons.

Key states:

- Pending: session exists, processing has not started.
- Running stream.
- Audio input with transcript arriving later.
- Waiting for user input: rare, but possible for person disambiguation or similar cases.
- Completed with artifacts.
- Completed with no artifacts: needs review because the input may have been empty, unclear, or nonsensical.
- Failed: error visible with a path back to the review session.

## Screen: Review Queue

Purpose: Give the user one place to inspect and acknowledge capture sessions that still need attention.

Primary user action: Open a session, resolve obvious issues, and mark it reviewed.

What it looks like:

The main Review page is more substantial than the sidebar preview. It is a queue-oriented list with filters at the top. The list is not a kanban board; it is closer to an inbox sorted by recency and urgency.

Each row represents one capture session and should stay concise, ideally two to three lines at most. It should show:

- created time
- input interface, preferably as a small icon or quiet label: web app for now, later possibly desktop app, iOS, Android, watch, or another capture source
- processing status
- review status
- very short transcript or generated summary preview, if useful
- small indicators for audio, memories, linked persons, and pending questions only when they add value

The queue emphasizes sessions needing human attention, but it should stay calm. Completed unreviewed sessions are normal. Failed, waiting-for-input, and suspect-transcript sessions should be visible without using alarming colors or large warning treatments.

The sidebar queue and Review page are connected: selecting an item from either opens the same Review Session Detail screen.

Key states:

- Empty queue: nothing needs review.
- Many unreviewed complete sessions.
- Mixed statuses: running, failed, waiting for input, completed.
- Search or filter active.
- Deleting a session from the queue.

## Screen: Review Session Detail

Purpose: Inspect one capture session as part of the review loop.

Primary user action: Decide whether the capture session is acceptable enough to mark reviewed.

What it looks like:

This is a higher-level inspection page for a capture session in the review context. It should be distinct from Active Run. Active Run is the detailed agent/chat stream. Review Session Detail is the calmer summary of what came in, what exists now, and what still needs a human decision.

The page may include a clear route into the detailed Active Run screen. In some cases, editing the transcript or answering a pending question may also trigger or resume an agent run, at which point the user can be taken into Active Run or shown an embedded run preview.

The layout can still be split into a source side and an artifacts side.

The source side contains:

- capture metadata
- transcript
- audio player when audio exists
- editable transcript fields if the product explicitly allows editing them

The artifacts side contains:

- memories created from the session
- persons created or linked during extraction
- pending questions if the run needs user input
- a link or affordance to open the detailed Active Run stream
- links into Memory Detail and Person Detail

The screen should make provenance easy to understand at a summary level: the user can see what was captured, what the system extracted, and where those artifacts now live. It does not need to show every streaming delta or tool call inline.

Marking as reviewed is a clear primary action, but it does not mean "approve before usable." The artifacts are already persisted. Review is acknowledgement and cleanup.

Key states:

- Completed and unreviewed.
- Already reviewed.
- Waiting for user input.
- Failed run with transcript or audio still available.
- Suspect transcript, possibly nonsensical.
- Transcript edited locally and ready for a future reprocessing flow.
- User opens or resumes the detailed Active Run from this screen.

## Screen: Memories

Purpose: Browse all persisted memories, independent of capture sessions.

Primary user action: Find and open a memory.

What it looks like:

This page is a memory library. It should be plain and inspectable rather than emotionally journal-like. The user sees a list of memories sorted by recency by default.

Top controls:

- text search over title and content
- memory type filter
- sort by recency

The list can be dense because this is an inspection and management surface. Each row or item should show:

- memory type
- title if present
- text preview
- created or timeline date
- linked persons if present
- origin session link

Timeline-specific presentation is intentionally absent in Stage 1. This page is a sortable memory overview, not a calendar.

Key states:

- Empty memory store.
- Normal list with mixed memory types.
- Filtered by type.
- Search with no results.
- Newly created memories visible immediately after capture.

## Screen: Memory Detail

Purpose: Inspect, edit, or delete a single memory.

Primary user action: Read or correct the persisted memory.

What it looks like:

The detail page gives the memory text enough room to be read comfortably. Metadata and provenance sit nearby but should not dominate the screen.

Main content:

- memory type
- title field if present
- memory text
- linked entities
- timeline date when set

Supporting content:

- created and updated timestamps
- source capture session
- navigation to linked person detail pages
- delete action

Editing should feel like editing the memory itself, not editing the original capture session. If a transcript correction is needed, the user should go to the capture session.

Key states:

- Read-only view.
- Editing.
- Unsaved changes.
- Delete confirmation.
- Linked person missing or deleted, if that state becomes possible.

## Screen: Sessions

Purpose: Browse capture sessions directly, including reviewed sessions.

Primary user action: Open a past capture session by recency, state, or capture source.

What it looks like:

This page is the full history of inputs that entered the capture system. It differs from the Review page because reviewed sessions remain visible here.

Each row shows:

- created time
- capture interface/source
- input kind when useful
- whether audio exists
- review status
- processing status
- transcript preview
- artifact count

The page is useful when the user remembers the act of recording more than the extracted memory. It is also useful for audit and debugging during Stage 1.

Key states:

- All sessions sorted by recency.
- Filtered to audio sessions.
- Filtered by capture interface/source.
- Filtered to failed sessions.
- Reviewed and unreviewed sessions mixed.
- Delete session confirmation.

## Screen: Capture Session Detail

Purpose: Inspect the raw capture event outside the review context.

Primary user action: Understand where memories came from.

What it looks like:

This page is the archive-oriented version of session inspection. It is similar to Review Session Detail, but it is entered from Sessions rather than from the review queue. The purpose is historical inspection and provenance, not necessarily active review.

If the session is unreviewed, the page can still expose a mark-reviewed action or a route into Review Session Detail. If the user wants the detailed agent stream, this page can also link to Active Run.

The detail should include:

- metadata useful for inspection
- transcript
- transcript segments if available later
- original audio playback when present
- memories produced from this session
- persons created or linked from this session
- current review status
- route to Active Run when the detailed processing stream matters

Key states:

- Text-only session.
- Uploaded audio session.
- Browser recording session.
- Failed processing session.
- Deleted artifacts or no artifacts.

## Screen: Contacts

Purpose: Manage persons created manually or through extraction.

Primary user action: Open a person and inspect linked memories.

What it looks like:

The Contacts page behaves like a simple address book backed by memory links. It is not a full CRM. It exists because people are stable entities that many memories can refer to.

The list shows:

- person name
- aliases
- count or preview of linked memories
- recently updated signal

There is a simple create-person action. Merge and deduplication are deferred.

Key states:

- Empty contacts.
- Normal list.
- Search by name or alias.
- Manually created person with no memories yet.
- Extracted person with linked memories.

## Screen: Person Detail

Purpose: Show what the system knows about a person and where that knowledge came from.

Primary user action: Read linked memories or correct basic person fields.

What it looks like:

The top of the page shows the person identity: name and aliases. Structured fields stay minimal in Stage 1. The main body is a list of linked memories, with friend notes likely appearing most often but not exclusively.

The page should make it easy to move from a person to:

- memories about that person
- the capture sessions that produced those memories
- edit fields such as name and aliases

Key states:

- Person with many linked memories.
- Person with no linked memories.
- Editing name or aliases.
- Person created from extraction and needing cleanup.

## Screen: ToDos

Purpose: Manage actionable items that emerge from captured memories.

Primary user action: Open a todo, understand its current state, and update it when needed.

What it looks like:

The ToDos page should be a first-class app area, similar in importance to Contacts. It is not just a filtered memory list, because tasks can become persistent entities with state. At the same time, it should stay lightweight and speech-driven rather than becoming a full project management tool.

The list shows concise task rows:

- task title or summary
- status
- due date or deadline when known
- linked originating todo memory
- recent capture or update context when helpful

The page should make it clear that a todo may have come from one or more captured memories. For example, "I still need to do my tax" may create or update a persistent todo, while a later capture may add context or indicate that the todo is no longer relevant.

Top controls can include:

- open / completed / cancelled filter
- search
- sort by due date or recency

Key states:

- Empty todo list.
- Open todos.
- Completed or cancelled todos.
- Todo created from extraction.
- Todo potentially matching an existing task and needing review.
- Todo with multiple linked memories.

## Screen: ToDo Detail

Purpose: Inspect and update one persistent task-like entity.

Primary user action: Read the todo, change its state, and inspect the memories that created or updated it.

What it looks like:

The top of the page shows the task summary, status, and deadline if one exists. The main body should show linked memories as evidence or history. This keeps the distinction clear: the todo is the persistent entity with state, while todo memories are event-like records that explain how the task entered or changed in the system.

Useful fields:

- title or summary
- status
- deadline when known
- linked memories
- source capture sessions
- created and updated timestamps

The detail page should support basic editing, but advanced task workflows are out of scope for this app structure draft.

Key states:

- Open todo.
- Completed todo.
- Cancelled todo.
- Editing title, status, or deadline.
- Inspecting linked memories and source sessions.

## Review Queue Placement Decision

In this variant, the review queue is always visible in the sidebar because it reinforces the product model: every capture becomes a session, and sessions may need review later.

The risk is that the app can start to feel task-heavy if the queue grows. The mitigation is to keep the sidebar queue compact. It should show only a small number of items plus a count. The full Review page owns deeper triage.

## Why This Variant Fits Stage 1

This structure maps directly to the Stage 1 requirements:

- capture supports text, upload, and recording
- active runs are inspectable through streaming progress
- review queue is a first-class surface
- persisted memories, persons, todos, and sessions have their own browsing and detail pages
- generated artifacts are visible immediately and do not wait for review

The main tradeoff is that it is conventional. It should be easier to build and reason about, but less distinctive than a more workflow-heavy design.
