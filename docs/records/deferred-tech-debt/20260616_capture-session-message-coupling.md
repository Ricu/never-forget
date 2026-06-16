# Capture Session Message Coupling

## Concern

The current `capture session` implementation persists PydanticAI `ModelMessage`
history directly and builds the reopened session view through the Vercel AI SDK
UI adapter.

This means the core capture-session model is coupled to the currently chosen
agent/message libraries instead of using a project-owned persisted interaction
shape.

## Why We Are Deferring It

- PydanticAI and the Vercel AI SDK UI data stream protocol are intentional
  `Initial Core` stack choices.
- The current message model is already close to the semantic interaction we want
  to persist.
- Adding a separate project-owned interaction model now would add mapping and
  maintenance cost without solving an immediate product problem.

## What To Revisit Later

- Whether `capture session` persistence should keep using raw `ModelMessage`
  values as the stored contract.
- Whether the application layer should stop depending directly on the Vercel UI
  adapter when building reopened session views.

## Revisit Trigger

Revisit this if one of these becomes true:

- we want to change agent/message libraries
- we need the persisted interaction model in non-chat surfaces
- library message shapes start leaking transport/runtime concerns into product
  behavior
