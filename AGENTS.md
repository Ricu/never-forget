# Repository-wide Rules

## Agent refinement is exclusive to the human

Unless directly asked by the human, do not modify the agent components. 

## Python Tooling

- We are using Astrals `uv` as a package manager. Use `pip` only as a last resort but clarify with the human first.
- We are using Astrals `ruff` for linting (`uv run ruff -fix` and `uv run ruff format`).