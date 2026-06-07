# Repository-wide Rules

## Authority Mapping

Respect the difference between canonical and non-canonical material/context in this project.

Canon: a source of truth about the system / project today:
- `docs/canon/**`
- `AGENTS.md`
- `CONTEXT.md` (ubiquoutus language)
- Agent skills
- docstrings
- Local code comments (should be used sparingly, primarily for non-obvious local reasoning)

Not Canon: intent, history, hypothesis:
- `docs/records/**`
- `docs/draft/**`
- `docs/deprecated/**`
- GitHub issues
- PR descriptions
- other material not belonging to canon.

## Agent refinement is exclusive to the human

Unless directly asked by the human, do not modify the agent components. 

## Python Tooling

- We are using Astrals `uv` as a package manager. Use `pip` only as a last resort but clarify with the human first.
- We are using Astrals `ruff` for linting (`uv run ruff -fix` and `uv run ruff format`).

## Agent skills

### Issue tracker

GitHub Issues are the repo's tracker. See `docs/canon/agents/issue-tracker.md`.

### Triage labels

The canonical triage labels use the default strings. See `docs/canon/agents/triage-labels.md`.

### Domain docs

Single-context repo guidance; ADRs live under `docs/records/adr`. See `docs/canon/agents/domain.md`.

### Tech Stack

Always read and respect the tech stacks.

@docs\canon\reference\backend\00_tech_stack.md
@docs\canon\reference\frontend\00_tech_stack.md