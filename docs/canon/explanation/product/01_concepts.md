# Concepts

- Memories
- Persistent Entitites
- Capture Session

## Memories

Memories are the primary persisted outputs produced by the capture system. They represent **observations, events, or pieces of information extracted from a capture session**.

They are typically:

* textual
* timestamped
* derived from a transcription
* contextual in nature

Memories are similar to "records" or "events" in the user's memory stream.

Examples include:

* a remembered moment
* a fact about a friend
* an idea
* a todo reminder
* a health symptom

Memories primarily capture **things that happened, were observed, or were mentioned**.

Memories are persisted but are conceptually **event-like records**. Rather than modeling each memory type as a separate class, the system stores memories in a shared, plain-text first structure with a `type` discriminator.

### Rationale

Most memory types differ primarily in **semantic interpretation**, not storage structure.

Using a shared memory model:

* simplifies the schema
* is LLM friendly
* avoids premature specialization
* supports rapid iteration

### Memory Types

Initial memory types include:

* `moment` - a personal experience or event
* `friend_note` - information about another person
* `idea` - a captured idea
* `todo` - a future action
* `symptom` - a health-related observation
* `miscellaneous` - a bucket for everything not fitting in the above.

For more information check out the detailed [memories overview doc](04_memories_overview.md).


## Persistent Entities

Persistent entities represent **stable objects in the user's world** that may be referenced repeatedly by memories.

These entities maintain identity across many memories.

Examples include:

* `person`
* `task`

Memories may link to these entities when relevant.

Example:

A `friend_note` memory may reference a `person` entity describing the individual.

### Persistent Entity vs Memory

To understand the distinction between memories and persistent entities, lets look at a todo vs a task:

* `todo` memories
* `task` entities

The memory represents the extracted instruction from the transcript.

A downstream process may convert this into a persisted `Task` object that manages task state.

Example:
```
ToDo: "I need to call the dentist tomorrow" -> Task: Title: Call Dentist, Deadline: <date>, Status: Open


ToDo: "I just called the dentist and made an appointment" -> Task: Title: Call Dentist, Deadline <date>, Status: Open
```

This allows the extraction layer to remain simple while enabling richer task behavior later.

### Rationale:

Separating memories from persistent entities allows the system to:

* keep extraction lightweight
* maintain stable identity objects
* support aggregation and linking across many memories

### Persons

Persons represent known individuals referenced by memories.

Examples:

* friends
* family members
* colleagues

Memories can link to persons when relevant.

Example:

A friend note memory may link to the person it describes.

Persons are stored as dedicated entities because:

* many memories may reference the same individual
* person identity must remain stable
* person object is suited for some more structured fields.
* deduplication and merging are required

## Capture Session

A capture session represents a single user recording event.

It stores:

* raw audio reference
* transcript
* metadata (timestamps, ASR model etc.)

Capture sessions represent the **input event** from which memories are generated.

Capture sessions are managed by the system orchestration layer and are not directly manipulated by the LLM.

### Rationale:

* enables replay of the original input
* preserves provenance of memories
* allows reprocessing in the future




