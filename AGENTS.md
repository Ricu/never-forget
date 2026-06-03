# Repository-wide Rules

## Agent refinement is exclusive to the human

Unless directly asked by the human, do not modify the agent components. 

## Python Tooling

- We are using Astrals `uv` as a package manager. Use `pip` only as a last resort but clarify with the human first.
- We are using Astrals `ruff` for linting (`uv run ruff -fix` and `uv run ruff format`).

## Agent skills

### Issue tracker

GitHub Issues are the repo's tracker. See `docs/agents/issue-tracker.md`.

### Triage labels

The canonical triage labels use the default strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo guidance; ADRs live under `docs/records/adr`. See `docs/agents/domain.md`.
