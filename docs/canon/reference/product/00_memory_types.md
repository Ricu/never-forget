
# Memories Overview

Memories are the primary persisted outputs produced by the capture system. They represent **observations, events, or pieces of information extracted from a capture session**.

Memories are persisted but are conceptually **event-like records**. Rather than modeling each memory type as a separate class, the system stores memories in a shared, plain-text first structure with a `type` discriminator.


## Common features

The general goal is: Clean up spoken language into readable memory text without changing meaning or losing nuance.

### General Styling

Here are some general styling guidelines to ensure there a degree of consistency and quality across all memories.

Memories should...
- ... be plain text at heart.
- ... preserve content, wording, intent and lines of thought.
- ... improve sentence flow, reference clarity, and readability.
- ... be adapted to the language used by the user / in the transcript.
- ... not drop any information, unless it is very obviously filler from the conversation (examples for filler: "So um yeah,...", "Well anyway...")
- ... not include recording date unless it is relevant to the memory itself.
- ... fullfill the users specific intent if the transcript contains one.
- ... not infer extra meaning, causes, or conclusions unless the user explicitly states them.

### Data Model

Fields:

* id
* capture_session_id
* type
* title (optional)
* text
* linked_entities (optional)
* timeline_at (optional, only when the memory should be placed on a time other than capture time)
* created_at
* updated_at

Example:

```
{
  "type": "friend_note",
  "text": "Alex is allergic to peanuts",
  "linked_entities": [
    {"type": "person", "id": "person_123"}
  ]
}
```

`timeline_at` is a special field. In the normal case, the memory belongs to the capture time. It should only be set when the transcript clearly refers to a different time, for example: "Yesterday I went to the doctor."

## Moments

**Definition:**
A `Moment` represents a personal experience or situation in which the user actively participated. It captures thoughts, reflections, and notable events that occurred at a particular time.

**Distinction:**
Moments are experiences—something the user lived through. Factual information about other people, even if learned during that moment, belongs to *Friend Notes* instead.

**Example:**

> Went for a walk with Alex. He told a story from his childhood, and the conversation was so funny it became a highlight of the day.

### Styling
In addition to the general stylings, "Moments" should...
- ... be first person, past tense personal recollections.
- ... feel like a remembered lived situation, not a log entry.
- ... only be split into multiple moments if there is a real experiential shift.


## Friend Note

**Definition:**
A `Friend Note` stores concrete facts, observations, or details about other people. It helps the user remember characteristics, anecdotes, or relevant background information about someone.

**Distinction:**
Friend Notes describe *other people*. They do not document experiences. If the focus is on the shared situation, it should be recorded as a *Moment* instead.


**Example:**

> Alex once fell into a well as a child.
> He is allergic to peanuts and went to Mallorca with Lisa in 2018.


### Styling

In addition to the general stylings, "Friend Notes" should...
- ... be written in third person.
- ... make sure that even details about a person are captured.
- ... keep relational context when it adds meaning, source clarity, or social context.


## ToDo

**Definition:**
A `ToDo` represents a specific task or reminder for future action. It serves as a lightweight, speech-driven alternative to a task management system.


**Example:**

> Buy flowers for Anna’s birthday next week.
> Call the dentist to schedule an appointment.


### Styling

In addition to the general stylings, "ToDos" should...
- ... focus on the "event" (i.e. the change), not the state of a task.
- ... should not merge multiple ToDos into one.
- ... follow the semi-structured pattern below.

### ToDo structure

A todo consists of a summary sentence and an optional paragraph with details. The summary sentence follows a pattern which should follow a canonical form.

The first summary sentence should express the task event in a small natural pattern (in the suitable language):
- “I need to …” for open or newly relevant tasks
- “I no longer need to …” for tasks that should no longer remain open
- “by …” for deadlines

The optional details section is a second paragraph which may add context, reason, outcome, or relevant details.

## Idea

**Definition:**
An `Idea` is a single captured thought or concept recorded during a transcription session. Multiple fragments together form a cohesive `Idea`, which represents a broader topic or project.


**Example:**

> For Christmas presents, maybe something personalized like photo books or engraved items.
> Could try an app that summarizes books automatically - maybe a future side project.

### Styling

In addition to the general stylings, "Idea" should...
- ... preserve the original line of thought and respect intent as much as possible.
- ... not flatten everything into a thematic summary unless the user explicitly wants that.
- ... preserve uncertainty and open questions.
- ... make it easier to reread later.


## Symptom

**Definition:**
A `Symptom` captures a personal observation related to physical or emotional well-being. Each entry documents when and how something felt off, potentially aiding in pattern recognition or medical tracking.

**Example:**

> Felt dizzy for about 10 minutes after breakfast. Might be related to poor sleep.
> Noticed mild chest tightness during the evening walk.

### Styling

In addition to the general stylings, "Symptoms" should...
- ... be first person and observational.
- ... improve phrasing but do not medicalize the language.
- ... keep relevant situational context, timing, or recurrence if mentioned.


## Miscellaneous

As this is the capture net for information that can not be categorized, we do not impose any special style apart from the general rules.
