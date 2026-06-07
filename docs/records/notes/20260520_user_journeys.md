# User Journeys

This document collects concrete capture and review journeys. The examples are not exhaustive. They are intended to clarify expected behavior and product challenges.

## Tax Todo

Example input:

> "I still need to do my tax."

Expected direction:

- should fall into the todo event type
- should reflect in persistent todos
- should create a new persistent todo if no suitable existing one exists
- may require verification if it appears to match an existing persistent todo

## Person Information: Birthday

Example input:

> "I just learned that Anna's birthday is on the 20th of January."

Expected direction:

- should be captured as person information
- should be linked to the correct person if possible
- is valuable because it may later map to a structured field on the Person
- may require disambiguation if multiple Annas are possible
- may require review if no suitable person is found, because this can mean either that a new person should be created or that the agent failed to find the right existing person

## Nonsensical Transcription

Example input:

> A relatively obviously nonsensical transcription.

Expected direction:

- can happen due to bad transcription
- should be surfaced during review or interactivity
- should leave the original audio available as a late-stage fallback
- should allow the user to fix the transcription manually

## Long Multi-Topic Recording

Example input:

> A relatively long recording with multiple topics and involved entities.

Expected direction:

- should separate different event types clearly
- should choose the correct granularity for extracted memories
- should preserve correct phrasing and information
- should link involved entities correctly where possible

## Context-Dependent Employer Note

Example input:

> "Google is an interesting employer."

Expected direction:

- meaning depends on context
- if there is a todo such as searching for jobs, it may belong there
- if there is an idea such as "interesting employers", it may be an idea fragment
- if there is no obvious context, the system may need interactivity to determine what to do with it
