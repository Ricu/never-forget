# LLM Processing

LLM processing starts after the capture session has processable text, either from direct text input or from preprocessing.

This stage is responsible for extracting meaningful artifacts from the transcript or submitted text. It is less deterministic than preprocessing and persistence because the agent may call tools, resolve context, or request user input.

## Agent Runs

An agent run starts from available capture-session input and tries to produce usable artifacts.

The agent may:

- extract memories
- search for existing persons or other relevant entities
- create proposed links between extracted information and existing entities
- use tools to persist extracted artifacts
- request user input when a decision should not be guessed

Some captures may pause before completion when user input is necessary, for example when multiple likely person matches exist.

## Interactive Tool Calls

Interactivity can be modeled as part of the review flow. If an agent needs user input, the capture session can remain in the review queue with a pending question. When the user answers, that answer can resume the relevant processing.

Example:

> "I just learned that Anna is from Berlin."

If the agent finds two possible Annas, it may need the user to identify the correct person. In an immediate review UI, the user may answer right away. In a deferred review UI, the same question can wait in the review queue.

## Corrections And Reprocessing

Corrections before or during LLM processing may require rerunning a non-deterministic part of the pipeline. Examples include changing the transcript, changing an earlier answer, or adding more input to the capture session.

The exact correction model is unresolved and should be clarified later.

## Appendix: Tool Definitions

### search_persons

Description:
Searches existing persons by name or alias so memories can link to the correct person.

Arguments:

- query: string
- limit: integer (optional)

### create_person

Description:
Creates a new person when the transcript references someone not already known.

Arguments:

- name: string
- aliases: string[] (optional)

### ask_question

Description:
Requests user input when the agent should not make a best-effort guess.

This is a conceptual interactive tool. It is useful for cases such as person disambiguation, where the agent finds multiple plausible matches.

Arguments:

- question: string
- options: array (optional)
- context: object (optional)

### ingest_artifacts

Description:
Persists all memories extracted from the current transcription in a single operation.

Arguments:

- memories: array of objects

ArtifactInput fields:

- type: string
- text: string
- title: string (optional)
- linked_entities: array (optional)

LinkedEntity fields:

- type: string
- id: string

Optional fields:

- timeline_at: string

`timeline_at` should only be set when the memory belongs on a different point in time than the capture itself. Example: "Yesterday I did x and y."

Example payload:

```json
{
  "memories": [
    {
      "type": "friend_note",
      "text": "Alex is allergic to peanuts",
      "linked_entities": [
        {"type": "person", "id": "person_123"}
      ]
    },
    {
      "type": "todo",
      "text": "Call the dentist tomorrow",
      "timeline_at": "2026-03-16"
    }
  ]
}
```
