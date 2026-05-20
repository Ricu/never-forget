# Stage 1 Product Requirements

This document defines the product requirements for Stage 1 of Never Forget.

Older docs sometimes call this "Phase 1". This document uses "Stage 1" consistently.

## Goal

Stage 1 should validate the full capture pipeline through a minimal local web app:

1. user submits input
2. backend creates a capture session
3. capture session is registered in the review queue
4. backend transcribes when needed
5. LLM extracts memories
6. extracted artifacts are persisted and become immediately usable
7. results become inspectable in the review queue UI
8. user can mark the capture session as reviewed

The main purpose of Stage 1 is not broad product completeness. It is to make the pipeline real, inspectable, and reusable across multiple capture sessions.

## Stage-1 Constraints

Stage 1 assumes:

* local-first single-user operation
* desktop-first usage
* modern Chromium browser support for in-browser recording
* synchronous backend execution behind a streamed UI
* SQLite persistence
* app-managed storage for captured audio files inside the data directory

## Stage-1 Scope

### Capture Inputs

The frontend must support starting a capture from exactly one of these inputs:

* direct text input
* upload of a single audio file
* in-app voice recording

Each submitted input creates one capture session.

Batch upload is out of scope for the web UI in Stage 1.

### Pipeline Execution

Submitting an input starts the capture pipeline immediately.

The Stage-1 backend flow is:

1. create capture session
2. register the capture session in the review queue
3. transcribe if the input is audio
4. run extraction agent
5. persist created memories and any created persons
6. return final run status

The pipeline may stay synchronous internally, but the frontend should experience it as a streamed run.

Persisted artifacts should be immediately available to the rest of the system. Stage 1 must implement the review queue as the main place where capture-session results become inspectable and can be marked as reviewed. Rich correction and reprocessing workflows can remain out of scope for the first increment.

Audio inputs must be normalized into app-managed storage before or during processing so uploaded files and browser recordings are later accessible from the same location.

### Streaming UX

The frontend should receive a live event stream for an active capture run using the Vercel AI SDK UI data stream protocol as the default protocol.

The primary visible stream content is assistant chat-completion style output. The stream must also carry backend events needed to render progress and persistence outcomes.

Minimum useful event types:

* run started
* transcription started
* transcription completed
* assistant text delta
* artifacts persisted
* run completed
* run failed

Where the Vercel AI SDK UI data stream protocol already provides a suitable standard event, the backend should use it. Product-specific needs may be added through custom events.

Artifacts persisted during the run must be surfaced in the active session or review queue UI without requiring a manual refresh.

### Persisted Data In Scope

Stage 1 uses real persistence, not mock persistence.

Persisted records in scope:

* capture sessions
* memories
* persons
* managed audio files referenced by capture sessions
* review status for capture sessions

The frontend must read persisted data back from storage and show it across sessions.

### Memory Browsing

The frontend must provide a memory overview that lets the user inspect all persisted memories.

Minimum Stage-1 capabilities:

* list memories
* show memory type clearly
* open a memory detail view
* navigate from a memory to its capture session
* edit a memory
* delete a memory

Helpful Stage-1 list operations:

* sort by recency
* filter by memory type
* text search over memory content and title

Timeline-specific presentation is out of scope for Stage 1.

Bulk operations are out of scope for the first Stage-1 increment.

### Capture Session Browsing

The frontend must provide a capture session detail view.

The view should include:

* capture-session metadata useful for inspection
* transcript
* list of persisted artifacts created from that session
* original audio playback when the session has audio

The frontend must also provide a capture-session list view so users can select past sessions directly.

Minimum capture-session list capabilities:

* list sessions by recency
* indicate input type
* indicate whether audio exists
* open capture-session detail
* delete a capture session

Capture-session detail must also support editing metadata and transcript fields that are explicitly made editable in the UI.

### Review Queue

The frontend must provide a review queue for capture sessions.

Minimum Stage-1 capabilities:

* list capture sessions that are not yet reviewed
* show enough run status to understand whether processing is pending, running, completed, or failed
* open the capture-session detail from the queue
* inspect the transcript and persisted artifacts produced from the session
* mark a capture session as reviewed

The review queue is not a full correction workflow in Stage 1. It is the required end-to-end inspection and acknowledgement surface for capture sessions, including completed capture runs.

### Contacts

The frontend must provide basic contact management centered on persons created or linked during extraction.

Minimum Stage-1 capabilities:

* list persons
* open person detail
* show memories associated with that person
* create a person
* edit a person
* navigate from a person to linked memories
* navigate from a linked memory to the person

Stage 1 contact management is basic CRUD plus linked-memory inspection. Rich deduplication workflows and merge tooling are deferred.

The user should be able to navigate easily between:

* active run view
* review queue
* memory overview
* memory detail
* capture session detail
* contact overview
* contact detail

### Review Loop

The minimal review queue is in scope for the first Stage-1 increment.

The user must be able to inspect a capture session's transcript and persisted artifacts from the review queue and mark the session as reviewed.

A full correction and reprocessing workflow is out of scope for the first Stage-1 increment.

## Out Of Scope

These are explicitly not required for the first Stage-1 increment:

* timeline view
* assisted retrieval / chat querying over stored memories
* multi-user support
* authentication
* mobile app
* background-job architecture
* full correction / reprocessing workflow
* advanced contact merge tooling
* batch web upload

## Acceptance Criteria

Stage 1 is successful when a user can:

1. submit text, an uploaded audio file, or a fresh voice recording from the web UI
2. watch the run progress through a live stream
3. see newly persisted memories appear as part of the run result or review queue entry
4. later open the memory overview and still find those memories
5. open a capture session from the review queue and inspect its transcript, produced artifacts, and original audio when available
6. mark a capture session as reviewed
7. open a contact and inspect the memories linked to that person

## Open Product Questions

The following decisions still need to be made before implementation is fully specified:

* Which memory and capture-session fields are editable in Stage 1, and which should remain system-managed?
* What metadata should be shown in memory detail, capture-session detail, and person detail beyond the obvious core fields?
* Do we need pagination from the start for memories, sessions, and contacts, or can Stage 1 ship with simple local lists first?
