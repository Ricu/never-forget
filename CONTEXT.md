# Never Forget

Shared domain language for Never Forget. This file defines the product terms we want to use consistently when discussing the domain.

When a term had earlier names, they should be listed under `Previous names`. If older docs, code, or discussions still use those names, that mismatch should be surfaced explicitly.

## Language

### Capture

**capture interface**:
A user-facing mechanism through which input enters the system. The webapp prompt input or input panel is one example of a capture interface.

**capture session**:
The system's container for one thing the user is trying to save. It groups the input provided for that capture, the related metadata, and everything the system produces from it. E.g. if more input is later added to clarify or refine that same thing, it still belongs to the same capture session.

### Memory

**memory**:
A central piece of information in Never Forget. A memory is a small, meaningful nugget created from captured input so it can later be browsed, found, related to other things, and reused. Its content is primarily freeform text.

**memory type**:
The kind of memory a memory is. Memory types give memories shared meaning, for example `moment`, `person_note`, `idea`, `todo`, `symptom`, and `miscellaneous`.

**moment**:
A moment represents a personal experience or situation in which the user actively participated. It captures thoughts, reflections, and notable events that occurred at a particular time.

**person_note**:
A person note stores concrete facts, observations, or details about other people. It helps the user remember characteristics, anecdotes, or relevant background information about someone.
Previous names: `friend_note`

**todo**:
A todo represents a specific task or reminder for future action. It serves as a lightweight, speech-driven alternative to a task management system.

**idea**:
An idea is a single captured thought or concept recorded during a capture session. Multiple fragments together form a cohesive idea, which represents a broader topic or project.

**symptom**:
A symptom captures a personal observation related to physical or emotional well-being. Each entry documents when and how something felt off, potentially aiding in pattern recognition or medical tracking.

**miscellaneous**:
A miscellaneous memory is a memory that does not fit the other memory types clearly enough. It remains usable as a memory without forcing a more specific classification.

### Review

**review queue**:
The set of capture sessions that need attention now. The review queue is what makes low-friction capture trustworthy: the user can capture quickly now and return later to inspect, correct, or continue the session.

### Session Language

**session thread**:
The conversation attached to a capture session. It contains the back-and-forth that belongs to that one thing the user is trying to save.
Previous names: `interaction history`, `thread`

**capture session view**:
The main place where a capture session is inspected and continued. It brings together the capture session, its session thread, and the memories that came out of it.

**capture session history**:
A place where the user can browse past capture sessions, including ones that no longer need attention now.

### Memory Surfaces

**memory overview**:
A place where the user can browse memories across capture sessions.

**memory detail**:
A focused view of one memory, used to inspect that memory more closely.
