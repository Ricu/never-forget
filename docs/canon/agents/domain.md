# Domain Docs

The engineering skills should use the repo's domain documentation as follows.

## What to read

- There is no root `CONTEXT.md` in this repo right now.
- There is no root `CONTEXT-MAP.md` in this repo right now.
- ADRs live under `docs/records/adr`.

If a file does not exist yet, proceed without it. Do not block on missing domain docs.

## Layout

This repo currently behaves like a single-context repo for agent guidance, with ADRs stored at:

```text
/
|-- AGENTS.md
|-- docs/
    `-- records/
        `-- adr/
```

If a future `CONTEXT.md` or `CONTEXT-MAP.md` is introduced, update this file to describe the new layout.

## Reading rule

When exploring a topic, read the relevant ADRs under `docs/records/adr` first. Use the vocabulary from domain docs when naming issues, refactors, tests, or hypotheses.
