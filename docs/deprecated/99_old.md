# Linking Model

Memories may reference persistent entities through a lightweight linking mechanism.

Instead of a relational link table, memories contain a field:

```
linked_entities: [{type, id}]
```

Each entry references a non-memory entity such as a `Person`.

Example:

```
linked_entities: [
  {"type": "person", "id": "person_123"},
  {"type": "person", "id": "person_456"}
]
```

### Rationale

This approach was chosen because:

* links are simple and few
* memories primarily link to stable entities
* relationship semantics can usually be inferred from the memory type

Example:

* a `friend_note` linked to a `Person` implies "information about that person"

The system deliberately avoids introducing a full link table until relationship complexity requires it.



# Timeline

Memories may optionally include a `timeline_at` timestamp representing when the event occurred.

This enables timeline views without enforcing strict temporal structure.

Not all memory types require a timeline timestamp.