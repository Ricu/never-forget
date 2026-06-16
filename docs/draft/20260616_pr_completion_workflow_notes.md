# PR Completion Workflow Notes

Before completing a PR, we should explicitly check:

- run the usual quality gates such as type checking and the test suite
- perform a code review, ideally both by Codex and by the human, with agreed review rules
- prompt for any already-spotted tech debt that should be recorded
- prompt for any ADRs that should be created from decisions made in the PR
- check whether any documentation needs to be updated
- check for schema changes and any required migration or rollback considerations
- check for config or environment variable changes
- run static security testing, for example with SonarQube

Open question:

- which of these should be mandatory every time, and which should be conditional on PR scope?
