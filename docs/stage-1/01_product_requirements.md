# Stage 1 Product Requirements

This document defines the product requirements for Stage 1 of Never Forget.

Older docs sometimes call this "Phase 1". This document uses "Stage 1" consistently.

## Goal

Stage 1 should validate the full capture pipeline through a minimal local web app:

1. user submits input
2. backend creates a capture session
3. backend transcribes when needed
4. LLM extracts memories
5. extracted artifacts are persisted
6. results become inspectable in the UI

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
2. transcribe if the input is audio
3. run extraction agent
4. persist created memories and any created persons
5. return final run status

The pipeline may stay synchronous internally, but the frontend should experience it as a streamed run.

Audio inputs must be normalized into app-managed storage before or during processing so uploaded files and browser recordings are later accessible from the same location.

### Streaming UX

The frontend should receive a live event stream for an active capture run using AG-UI as the default protocol.

The primary visible stream content is assistant chat-completion style output. The stream must also carry backend events needed to render progress and persistence outcomes.

Minimum useful event types:

* run started
* transcription started
* transcription completed
* assistant text delta
* artifacts persisted
* run completed
* run failed

Where AG-UI already provides a suitable standard event, the backend should use it. Product-specific needs may be added through custom events.

Artifacts persisted during the run must be surfaced in the active session view without requiring a manual refresh.

### Persisted Data In Scope

Stage 1 uses real persistence, not mock persistence.

Persisted records in scope:

* capture sessions
* memories
* persons
* managed audio files referenced by capture sessions

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
* memory overview
* memory detail
* capture session detail
* contact overview
* contact detail

### Review Loop

A review / correction loop is a known future part of the product but is out of scope for the first Stage-1 increment.

The Stage-1 design should leave a natural insertion point after extraction and around artifact persistence.

## Out Of Scope

These are explicitly not required for the first Stage-1 increment:

* timeline view
* assisted retrieval / chat querying over stored memories
* multi-user support
* authentication
* mobile app
* background-job architecture
* review / correction workflow
* advanced contact merge tooling
* batch web upload

## Acceptance Criteria

Stage 1 is successful when a user can:

1. submit text, an uploaded audio file, or a fresh voice recording from the web UI
2. watch the run progress through a live stream
3. see newly persisted memories appear as part of the run result
4. later open the memory overview and still find those memories
5. open a capture session and inspect its transcript, produced artifacts, and original audio when available
6. open a contact and inspect the memories linked to that person

## Open Product Questions

The following decisions still need to be made before implementation is fully specified:

* Which memory and capture-session fields are editable in Stage 1, and which should remain system-managed?
* What metadata should be shown in memory detail, capture-session detail, and person detail beyond the obvious core fields?
* Do we need pagination from the start for memories, sessions, and contacts, or can Stage 1 ship with simple local lists first?
