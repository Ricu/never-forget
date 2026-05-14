# Tool Definitions

## search_persons

Description:
Searches existing persons by name or alias so memories can link to the correct person.

Arguments:

* query: string
* limit: integer (optional)

---

## create_person

Description:
Creates a new person when the transcript references someone not already known.

Arguments:

* name: string
* aliases: string[] (optional)

---

## ingest_artifacts

Description:
Persists all memories extracted from the current transcription in a single operation.

Arguments:

memories: array of objects

ArtifactInput fields:

* type: string
* text: string
* title: string (optional)
* linked_entities: array (optional)

LinkedEntity fields:

* type: string
* id: string

Optional fields:

* timeline_at: string

`timeline_at` should only be set when the memory belongs on a different point in time than the capture itself. Example: "Yesterday I did x and y."

Example payload:

```
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
