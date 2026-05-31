# Initial Core PRD

## Application Context

Never Forget is being built as a local-first personal memory application centered on low-friction capture and later reuse of captured information. The broader product direction includes capture, review, exploration, and later assisted retrieval. The current challenge is not implementing one isolated feature. The challenge is establishing the first real working core of the application in a way that can be tried, learned from, and iterated on without prematurely committing to too much structure.

Earlier planning drifted in two directions:

- some docs still described a very early, mock-heavy, pipeline-only increment
- other docs and records had already started assuming richer persistent-entity behavior, especially around persons and todos

This PRD captures the current shared understanding after revisiting that drift.

The goal of `Initial Core` is not to design the full product in advance. It is to build the first meaningful core of the application, try it in practice, and iterate from there. This means preserving important product structure and nuance while avoiding a waterfall-style attempt to fully specify later behaviors too early.

`Initial Core` is therefore centered on the `capture session` as the main object of the application at this stage.

## Solution

Build the first working application core around `capture sessions`, typed `memories`, and a review-oriented workflow.

The application should let the user:

- start a capture from direct text, single audio upload, or in-browser voice recording
- create one `capture session` per originating input
- register every `capture session` in the `review queue` immediately when it is created
- preprocess audio when needed, including normalization and transcription
- persist interaction history attached to the `capture session`
- allow the assistant to continue the interaction through `user`, `assistant`, and `tool` messages
- persist typed `memories` as the main extracted output of the system
- make created memories usable immediately rather than blocking them on review
- inspect and continue a `capture session` through one unified chat-like view
- browse all `capture sessions` globally
- browse all `memories` globally

The first build should be intentionally conservative in some areas:

- no persistent entities such as persons, tasks, todos, or other entity-centric workflows
- no assisted retrieval or global chat/query surface
- no manual memory creation
- no editing or deletion of memories in the first pass
- no transcript editing in the first pass
- no arbitrary follow-up capture content added later to an existing session

The first build should still be structurally rich enough to support iteration in the right places:

- the `review queue` begins at `capture session` creation, not after extraction
- the unified `capture session` view must be able to represent multiple states over time
- deferred tool calls that need user input are structurally in scope
- the exact assistant behavior is intentionally not fully pinned yet and should be explored during iteration

## User Stories

1. As a user, I want to quickly record information without being forced into heavy structure up front, so that I can actually use the app in everyday situations.
2. As a user, I want to submit direct text as capture input, so that I can use the app even when voice is not convenient.
3. As a user, I want to upload a single audio file as capture input, so that I can process recorded material through the same system.
4. As a user, I want to create a fresh in-browser voice recording, so that I can capture thoughts directly inside the app.
5. As a user, I want each originating input to create a distinct `capture session`, so that each capture remains inspectable and understandable later.
6. As a user, I want the app to register the `capture session` in the `review queue` immediately, so that the session is visible to me from the start rather than only after some later processing stage.
7. As a user, I want audio input to be normalized and transcribed automatically, so that the app can work with audio in the same overall structure as text input.
8. As a user, I want the transcript to be treated as the first user message in the interaction history, so that the assistant interaction starts from the actual textual material being processed.
9. As a user, I want raw audio to remain available as source material outside the interaction history, so that I can refer back to it when needed.
10. As a user, I want the app to preserve the interaction history attached to a `capture session`, so that reopening a session later feels like returning to the same interaction rather than seeing a lossy reconstruction.
11. As a user, I want the interaction history to consist of meaningful `user`, `assistant`, and `tool` messages, so that the persisted history reflects the actual interaction rather than low-level protocol noise.
12. As a user, I want the app to show one unified chat-like `capture session` view, so that I have one main place to inspect and continue a capture.
13. As a user, I want that unified `capture session` view to work both while processing is underway and when I reopen the session later, so that the surface stays stable across states.
14. As a user, I want the assistant interaction to be attached to a specific `capture session`, so that it is clear what input and outputs belong together.
15. As a user, I want extracted `memories` to be persisted as separate records, so that they can be used by the application without having to parse the interaction history.
16. As a user, I want every persisted `memory` in this increment to originate from exactly one `capture session`, so that provenance remains simple and trustworthy.
17. As a user, I want one `capture session` to be able to produce multiple `memories`, so that the system can handle multi-topic inputs or several distinct pieces of information from one capture.
18. As a user, I want `memories` to use explicit memory types, so that the extracted output has enough structure to be useful and inspectable.
19. As a user, I want the memory type vocabulary to remain stable in this increment, so that I can learn how the system behaves on real inputs.
20. As a user, I want memory `title` to remain optional, so that extraction is not forced into unnecessary summarization before it proves useful.
21. As a user, I want created `memories` to become usable immediately once they are persisted, so that review does not block the rest of the system from using new information.
22. As a user, I want a `capture session` with no extracted memories to still remain visible and inspectable, so that weak or failed extraction outcomes can still be understood and learned from.
23. As a user, I want the `review queue` to represent captures that need attention now, so that the queue reflects actionable work rather than a simplistic reviewed/unreviewed split.
24. As a user, I want `reviewed` to mean only that a `capture session` does not need to remain in the `review queue` right now, so that review stays lightweight and does not imply correctness or final approval.
25. As a user, I want the app to support a low-friction default path where I submit input and move on, so that capture stays easy in spontaneous situations.
26. As a user, I want an explicit `review immediately` control on the `capture` surface, so that I can choose to go directly into the `capture session` view when I have time.
27. As a user, I want `review immediately` to remain an orchestration choice rather than a separate system, so that immediate and deferred review stay structurally aligned.
28. As a user, I want a dedicated `capture` surface separate from the `capture session` view, so that quick input and later inspection do not collapse into one overloaded surface too early.
29. As a user, I want a global `review queue`, so that I can see which captures still need attention.
30. As a user, I want a global `capture-session history`, so that I can reopen older `capture sessions` even when they no longer need review.
31. As a user, I want a global `memory overview`, so that I can inspect extracted memories across sessions rather than only inside their origin session.
32. As a user, I want a read-only `memory detail` view, so that I can inspect one memory in full without cluttering the overview list.
33. As a user, I want to navigate from a `memory` back to its origin `capture session`, so that provenance remains easy to understand.
34. As a user, I want `review queue`, `capture-session history`, and `memory overview` to support search and filtering, so that the application remains usable once data accumulates.
35. As a user, I want the exact filter model to stay flexible for iteration, so that the app can evolve based on real usage rather than premature assumptions.
36. As a user, I want the first pass to be inspectable rather than corrective, so that the application core can be validated before more complex editing and reprocessing behavior is introduced.
37. As a user, I want transcript editing to remain out of scope in the first pass, so that the system does not yet have to solve non-deterministic rerun behavior.
38. As a user, I want memory editing to remain out of scope in the first pass, so that memory inspection can be validated before CRUD behavior is added.
39. As a user, I want deletion of `capture sessions` and `memories` to remain out of scope in the first pass, so that early provenance and learning data are preserved.
40. As a user, I want deferred tool calls that need user input to be structurally supported, so that the application can explore assistant behavior that is not purely one-shot.
41. As a user, I want later continuation inside a `capture session` to be limited to answering deferred tool calls, so that a session remains one capture event rather than becoming a general-purpose ongoing conversation.
42. As a user, I want each `capture session` to have exactly one originating capture input, so that the meaning of the session stays clean.
43. As a user, I want the app to communicate a small, understandable set of user-facing statuses such as `processing underway`, `input required`, `complete`, and `failed`, so that I can quickly understand where a capture stands.
44. As a user, I want `input required` to be foregrounded when the app needs something from me, so that the queue emphasizes actionable states.
45. As a user, I want chat-like interaction to exist only inside a specific `capture session` in this increment, so that the system does not drift into a second product focused on global querying.
46. As a user, I want assisted retrieval to be deferred until later, so that the initial build stays focused on the minimal application core.
47. As a user, I want persistent entities such as persons and todos to be deferred until later, so that the initial build does not create a messy entity layer before memory extraction behavior is better understood.
48. As a user, I want conceptual and record docs to remain available as broader context and outlook, so that later iteration still has access to the project’s longer-term thinking.
49. As a user, I want this PRD to serve as a substantive shared reference point rather than a vague intention list, so that later design and implementation work can build from something stable.

## Implementation Decisions

- The increment is called `Initial Core`. This replaces the use of `Stage 1` as the main planning term for the current effort.
- `Initial Core` is not a small feature slice. It is the first real working core of the application.
- The purpose of `Initial Core` is to build a minimal but meaningful application core, try it out, and iterate from it.
- `capture session` remains the canonical name for the primary object of this increment.
- The `capture session` is the backbone of `Initial Core`.
- A `capture session` owns or references:
  - the originating input event
  - source references such as audio where applicable
  - a canonical transcript field
  - persisted interaction history
  - current product-level capture state
  - extracted memories linked back to it
- The persisted interaction history is not introduced as a separate first-class product object.
- The recommended phrasing is that the `capture session` persists interaction history consisting of `user`, `assistant`, and `tool` messages.
- The informal word `"thread"` may be useful in conversation, but it should not be treated as the canonical product term at this stage.
- The product should avoid using `agent run` as a core product term in this area because it suggests a narrower or different abstraction than the one being designed.
- The preferred framing is the `state of the capture session` or the interaction/history attached to the `capture session`.
- The `review queue` is a canonical surface name and should be defined semantically as `capture sessions that need attention now`.
- `reviewed` is intentionally narrow. It means that a `capture session` does not need to remain in the `review queue` right now.
- `reviewed` does not mean:
  - the extracted memories are correct
  - the interaction is approved
  - the session is final forever
- `Initial Core` supports exactly three originating capture inputs:
  - direct text
  - upload of a single audio file
  - in-browser voice recording
- No other attachment or input types are in scope for this increment.
- Every originating input creates exactly one `capture session`.
- A `capture session` has exactly one originating capture input.
- Later interaction within the same `capture session` is allowed, but only as continuation around deferred tool calls that need user input.
- Arbitrary new follow-up capture content added later to an existing `capture session` is out of scope for this increment.
- Audio input requires preprocessing.
- Audio preprocessing includes normalization into app-managed storage and transcription.
- Raw audio remains outside the interaction history as source material referenced by the `capture session`.
- For audio capture, the transcript becomes the first user message in the persisted interaction history.
- For direct text capture, the submitted text itself is the first user message in the interaction history.
- Direct text input does not require a separate raw-source record in this increment.
- The canonical transcript should still be stored as a separate field on the `capture session`, even though the same transcript also appears as the first user message in the interaction history.
- This duplication is intentional because:
  - the interaction history serves the user-facing interaction
  - the canonical transcript field simplifies previews, search, filtering, and backend logic
- The interaction history should contain only meaningful persisted interaction content.
- Low-level progress events, protocol events, and debug-oriented information should not become part of the core persisted interaction model.
- Extracted `memories` are the main persisted product output of `Initial Core`.
- `memories` remain separate persisted records linked back to the originating `capture session`.
- The app should use those persisted records and links as the authoritative relation between `memories` and `capture sessions`.
- The app should not attempt to infer formal memory/session relations by parsing the interaction history.
- The interaction history may still contain assistant or tool output that presents or discusses extracted memories in context.
- One `capture session` may produce many `memories`.
- In this increment, each persisted `memory` originates from exactly one `capture session`.
- The memory type vocabulary remains in scope and should be preserved:
  - `moment`
  - `friend_note`
  - `idea`
  - `todo`
  - `symptom`
  - `miscellaneous`
- Even though persistent entities are deferred, typed memories remain important because they provide useful structure without forcing entity lifecycle complexity too early.
- `title` on `memory` remains optional.
- The UI and data model must work well even when a memory has no title.
- `memories` should become usable immediately once persisted.
- Review must not be a gating approval step for memory usability.
- A `capture session` that yields no extracted `memories` is still a valid and inspectable persisted outcome.
- This is important because weak or null extraction outcomes are still valuable during early product learning.
- Persistent entities are explicitly deferred from `Initial Core`.
- This includes persons, tasks, todos as persistent entities, and similar entity-centric management layers.
- The app may still capture memory content about people, tasks, or ideas in plain memory form.
- The app does not yet need to solve the entity-layer problem of converting memories into durable persistent entities without creating a mess.
- Because persistent entities are deferred:
  - no contacts surface is required
  - no todo/task management surface is required
  - no person lookup or matching workflow is required as a defined product requirement of this increment
- The application should still structurally allow deferred tool calls that need user input.
- However, the exact assistant behavior and exact kinds of questions are intentionally not fully pinned in this PRD.
- This is deliberate.
- One of the purposes of `Initial Core` is to discover and iterate on the assistant behavior through actual use rather than over-specifying it now.
- The PRD therefore specifies the structure of the interaction rather than all detailed assistant behaviors.
- The main interactive surface of the application is one unified chat-like `capture session` view.
- This view is the place for:
  - transcript visibility
  - interaction history
  - reading assistant output
  - seeing extracted memories in context
  - handling deferred tool calls that need user input
- The unified `capture session` view must be able to handle multiple states over time.
- One of those states is that processing is underway and results are being streamed in.
- More detailed screen-level state handling is intentionally deferred for later planning.
- The application should use a dedicated `capture` surface separate from the unified `capture session` view.
- The `capture` surface exists to preserve the low-friction quick-input path.
- The unified `capture session` view exists to inspect and continue one specific capture.
- `review immediately` remains in scope as an explicit control on the `capture` surface.
- The default path is that the user submits input and stays in the capture context.
- The optional path is that the user submits input and is taken directly into the unified `capture session` view.
- This is an orchestration choice, not a separate system.
- The global navigation for `Initial Core` is intentionally minimal and consists of four primary surfaces:
  - `capture`
  - `review queue`
  - `sessions`
  - `memory overview`
- `Sessions` is the recommended user-facing label for the global capture-session history surface.
- `capture session` remains the precise product/model term underneath that label.
- The `review queue` and global `sessions` surface are two views over the same underlying set of `capture sessions`.
- The difference is semantic:
  - `review queue` shows `capture sessions` that need attention now
  - `sessions` shows all `capture sessions`
- The `memory overview` is a separate global view over persisted `memories`.
- A read-only `memory detail` view is required.
- Opening a `capture session` from either `review queue` or `sessions` should lead into the same unified `capture session` view.
- No separate archive-style `capture session detail` surface is required in this increment.
- The first pass is intentionally inspectable and non-destructive.
- The first pass does not include:
  - memory editing
  - memory deletion
  - transcript editing
  - capture-session deletion
  - manual memory creation
- The reason is to validate the structure and behavior of the application core before introducing more complicated CRUD and correction behavior.
- `review queue`, `sessions`, and `memory overview` all require search/filter capability from the start.
- The exact filter model is intentionally not pinned here.
- The important point is that these surfaces must remain usable as data accumulates.
- `mark as reviewed` should be available from within the unified `capture session` view rather than from the queue list itself.
- The relevant decision should be made while the user is looking at the full context of that `capture session`.
- The small user-facing status model should remain simple:
  - `processing underway`
  - `input required`
  - `complete`
  - `failed`
- `input required` should be the primary visible state when the system is waiting on user input because it is the most actionable status.
- Assisted retrieval is explicitly out of scope for `Initial Core`.
- A global chat/query surface is also out of scope.
- The chat-like interaction in this increment belongs only to a specific `capture session`, not to querying the whole memory base.
- The current app-structure record in `docs/records/mockups/001_initial_app_structure` can be used as rough inspiration for structure, but it is non-canonical and must be adapted to the decisions captured here.
- Older conceptual docs and records are allowed to remain as broader outlook or historical record for now.
- This PRD, rather than those older docs, is the main reference for the `Initial Core` direction until a later canonical assimilation step.

## Testing Decisions

- Testing should stay light in this increment because the application is expected to change quickly.
- Tests should focus on behavior rather than implementation details.
- The purpose of tests in this phase is to give confidence that the core application behavior works while staying cheap enough to evolve with the product.
- A good test in this increment verifies externally visible behavior or stable contract behavior.
- A bad test in this increment would overfit to internal structure that is likely to change as the application is iterated on.
- There is no special testing program or heavy testing emphasis required beyond normal lightweight behavior-focused testing.

## Out of Scope

- persistent entities such as persons, tasks, todos, and related management workflows
- contacts and contact-detail surfaces
- todo/task overview and task-detail surfaces
- assisted retrieval
- global chat/query over the memory base
- non-audio attachments beyond direct text input
- batch upload
- multi-user support
- authentication
- full correction and reprocessing model
- transcript editing in the first pass
- memory editing in the first pass
- manual memory creation
- deletion of `memories`
- deletion of `capture sessions`
- arbitrary new follow-up capture content added later to an existing `capture session`
- detailed pinning of assistant behavior beyond the agreed structural boundaries
- detailed screen composition and fine-grained state design for the unified `capture session` view

## Further Notes

- This PRD intentionally shifts the typical feature-PRD template toward application-foundation planning because the work is about establishing the first working core of the app, not delivering one narrow feature.
- The focus of this PRD is to preserve the important substance and nuance that emerged during the conversation without forcing exhaustive waterfall-style specification.
- The exact assistant behavior, especially around deferred tool calls that need user input, is intentionally left open enough to be learned through iteration in `Initial Core`.
- The relationship between typed `memories` and later persistent entities remains an acknowledged future problem. The current decision is to defer solving that problem until after the application core for capture sessions and memories has been tried in practice.
- This record should later feed into a new canonical document. It is not itself the final cleanup pass for the wider docs set.
