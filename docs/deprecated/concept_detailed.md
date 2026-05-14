# Never Forget - Concept

## Overview

The purpose of this application (called "Never Forget") is to provide a low-threshold way to capture and remember various types of information. The motivation arises from the difficulty of consistently remembering events, facts, and ideas. Traditional note-taking often fails because it requires manual typing and categorization. To address this, the application integrates speech transcription (via ASR models) and an LLM agent that automatically categorizes transcribed content into appropriate data types.

The system is built around the concept of **Memories** - atomic units of information representing things to be remembered. Different categories of memories capture different aspects of life, such as experiences, thoughts, or facts about people.

The project is initially implemented in Python as a proof of concept. If successful, it may evolve into a standalone offline-first application that only relies on external AI services for transcription, LLM processing, and embeddings.

---

## Core Concepts

### Memory (Base Class)

`Memory` is the abstract base class representing a single unit of remembered information. Each subclass defines a specific semantic type, determining how the information is interpreted and displayed.

**Purpose:**
Memories act as self-contained, document-like entities. They are stored in a single SQLite table (allowing future migration to Postgres) with JSON metadata fields for flexibility. This design keeps the system **offline-first** and allows easy evolution of memory types without schema migrations.

**Attributes:**

* `id`: unique identifier (UUID)
* `entry_id`: groups all memories created at the same time (e.g., during one transcription session)
* `type`: discriminator identifying the semantic type of the memory (e.g., `moment`, `friend_note`, `idea_fragment`, etc.)
* `title`: short human-readable label; optional and auto-fillable
* `text`: the main body of the memory (raw or processed transcription)
* `source`: indicates origin (e.g., `voice_transcription`, `manual_entry`, `imported_audio`)
* `source_file`: optional path or identifier for imported media (future support for audio/image attachments)
* `attachments`: optional list of linked files or media references (kept in base class for future extensibility)
* `tags`: optional list of strings, reserved for future use
* `timestamp`: represents when the memory occurred or was recorded
* `created_at` / `updated_at`: system timestamps for bookkeeping

This compact, extensible base allows new memory types to be added without altering the schema.

---

### Moment (Memory)

**Definition:**
A `Moment` represents a personal experience or situation in which the user actively participated. It captures thoughts, reflections, and notable events that occurred at a particular time.

**Distinction:**
Moments are self-centered experiences—something the user lived through. Factual information about other people, even if learned during that moment, belongs to *Friend Notes* instead.

**Attributes (in addition to base `Memory`):**

* `people_involved`: optional list of `Person` IDs (future implementation)

**Container:**
Conceptually grouped under `Diary`, though the diary might be treated as a logical view rather than a standalone class.

**Example:**

> Went for a walk with Alex. He told a story from his childhood, and the conversation was so funny it became a highlight of the day.

---

### Friend Note (Memory)

**Definition:**
A `Friend Note` stores concrete facts, observations, or details about other people. It helps the user remember characteristics, anecdotes, or relevant background information about someone.

**Distinction:**
Friend Notes describe *other people*. They do not document experiences. If the focus is on the shared situation, it should be recorded as a *Moment* instead.

**Attributes (in addition to base `Memory`):**

* `person_id`: reference to a `Person` entity

**Container:**
Contained in `Contacts`, alongside the associated `Person` entities.

**Example:**

> Alex once fell into a well as a child.
> He is allergic to peanuts and went to Mallorca with Lisa in 2018.

---

### Person

**Definition:**
A `Person` represents a known individual about whom memories (Friend Notes, Moments, etc.) may be recorded.

**Attributes:**

* `id`: UUID
* `semantic_id`: human-readable token (e.g., `alex_smith`) for LLM interaction and reference
* `name`: display name
* `aliases`: list of alternative names or nicknames
* `birthdate`: optional
* `relationships`: optional dictionary describing relationship metadata (e.g., `{role: 'friend', met: '2017'}`)
* `tags`: optional list of thematic tags (e.g., `work`, `family`)
* `created_at` / `updated_at`: timestamps

**Container:**
`Contacts` — collection of Persons and their Friend Notes.

---

### ToDo (Memory)

**Definition:**
A `ToDo` represents a specific task or reminder for future action. It serves as a lightweight, speech-driven alternative to a task management system.

**Attributes (in addition to base `Memory`):**

* `due_date`: optional datetime
* `priority`: optional string (`low`, `medium`, `high`)
* `status`: string (`pending`, `done`, `cancelled`)
* `tag`: optional short label (e.g., `personal`, `work`)

**Container:**
`ToDo List` — a collection of actionable items.

**Example:**

> Buy flowers for Anna’s birthday next week.
> Call the dentist to schedule an appointment.

---

### Idea Fragment (Memory)

**Definition:**
An `Idea Fragment` is a single captured thought or concept recorded during a transcription session. Multiple fragments together form a cohesive `Idea`, which represents a broader topic or project.

**Attributes (in addition to base `Memory`):**

* `idea_id`: reference to the parent `Idea`

**Container:**
Grouped under an `Idea`, and all ideas are collected in an `Idea List`.

**Example:**

> For Christmas presents, maybe something personalized like photo books or engraved items.
> Could try an app that summarizes books automatically - maybe a future side project.

---

### Idea

**Definition:**
An `Idea` aggregates multiple fragments or represents a conceptual project or topic, which may be created manually or automatically.

**Attributes:**

* `id`: UUID
* `semantic_id`: human-readable ID for use by the LLM or search system
* `title`: short name or theme
* `description`: optional longer text or synthesis
* `created_at` / `updated_at`: timestamps
* `fragments`: list of `IdeaFragment` IDs
* `tags`: optional list of thematic tags

**Container:**
`Idea List` — navigation for ideas and their fragments.

---

### Symptom (Memory)

**Definition:**
A `Symptom` captures a personal observation related to physical or emotional well-being. Each entry documents when and how something felt off, potentially aiding in pattern recognition or medical tracking.

**Attributes (in addition to base `Memory`):**

* `severity`: optional integer (e.g., 1–10)
* `body_area`: optional string (e.g., `chest`, `head`)

**Container:**
`Symptom History` — chronological record of symptoms for reference and analysis.

**Example:**

> Felt dizzy for about 10 minutes after breakfast. Might be related to poor sleep.
> Noticed mild chest tightness during the evening walk.

---

## Containers vs. Functional Components

The model distinguishes between **domain entities**, **containers**, and **functional components**.

**Domain Entities** represent fundamental objects of memory (e.g., `Moment`, `Friend Note`, `Person`).
**Containers** act as aggregations or organizational structures (e.g., `Diary`, `Contacts`, `Idea List`).
**Functional Components** define user-facing sections of the application (e.g., calendar, record view).

### Domain Entities

* `Memory`
* `Moment`
* `Friend Note`
* `Person`
* `ToDo`
* `Idea Fragment`
* `Idea`
* `Symptom`

### Containers (Aggregation Views)

* `Diary` (collection of Moments)
* `Contacts` (collection of Persons and Friend Notes)
* `ToDo List`
* `Idea List`
* `Symptom History`

### Functional Components (App Sections)

* **Record Section:** Core interface for capturing input through transcription and categorization.
* **Calendar View:** Displays all memories for a given day or period.
* **Idea List / Catalog:** Navigation for ideas and their fragments.
* **Contacts Section:** Functions as an enhanced address book with Friend Notes.
* **ToDo Section:** Overview and management of actionable items.
* **Symptom History Section:** Tracking and reviewing health-related observations.
* **Remember Section (Planned):** Search and retrieval of past information across all memory types.

---

## Architectural Considerations

* The system is **offline-first**, requiring online connectivity only for ASR, LLMs, and embeddings.
* All memories are stored in a **single SQLite table**, with JSON metadata for type-specific attributes.

  * This allows flexible extension and avoids frequent schema migrations.
  * A `type` field in each entry distinguishes the semantic category of the memory.
  * Migration to Postgres or similar systems will be straightforward later.
* `entry_id` provides contextual linkage across multiple memories created during one session.
* Containers primarily serve as **logical groupings or query views** rather than independent models.
* `attachments` in the base class provide a future-proof way to associate files or media without changing schema.
* Maintaining clear separation between **semantic memory types**, **aggregation structures**, and **functional UI components** supports scalability and adaptability.
* Python serves as the primary environment for prototyping, with potential future expansion into a full-fledged cross-platform application.
