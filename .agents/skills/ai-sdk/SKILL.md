---
name: ai-sdk
description: 'Answer questions about the AI SDK and help build AI-powered features. Use when working on agentic AI user interfaces. Triggers on e.g. "useChat".'
---

## Prerequisites

Before searching docs, check if `node_modules/ai/docs/` exists. If not, install **only** the `ai` package using the project's package manager (e.g., `pnpm add ai`).

Do not install other packages at this stage. Provider packages (e.g., `@ai-sdk/openai`) and client packages (e.g., `@ai-sdk/react`) should be installed later when needed based on user requirements.

## Critical: Do Not Trust Internal Knowledge

Everything you know about the AI SDK is outdated or wrong. Your training data contains obsolete APIs, deprecated patterns, and incorrect usage.

**When working with the AI SDK:**

1. Ensure `ai` package is installed (see Prerequisites)
2. Search `node_modules/ai/docs/` and `node_modules/ai/src/` for current APIs
3. If not found locally, search ai-sdk.dev documentation (instructions below)
4. Never rely on memory - always verify against source code or docs
5. **`useChat` has changed significantly** - check [Common Errors](references/common-errors.md) before writing client code
6. When deciding which model and provider to use (e.g. OpenAI, Anthropic, Gemini), ask the user or re-use existing choices.
7. Run typecheck after changes to ensure code is correct
8. **Be minimal** - Only specify options that differ from defaults. When unsure of defaults, check docs or source rather than guessing or over-specifying.

If you cannot find documentation to support your answer, state that explicitly.

## Finding Documentation

### ai@6.0.34+

Search bundled docs and source in `node_modules/ai/`:

- **Docs**: `grep "query" node_modules/ai/docs/`
- **Source**: `grep "query" node_modules/ai/src/`

Provider packages include docs at `node_modules/@ai-sdk/<provider>/docs/`.

### Earlier versions

Surface to user.

## When Typecheck Fails

**Before searching source code**, grep [Common Errors](references/common-errors.md) for the failing property or function name. Many type errors are caused by deprecated APIs documented there.

If not found in common-errors.md:

1. Search `node_modules/ai/src/` and `node_modules/ai/docs/`
2. Search ai-sdk.dev (for earlier versions or if not found locally)

## Building and Consuming Agents

### Creating Agents

Always use the `ToolLoopAgent` pattern. Search `node_modules/ai/docs/` for current agent creation APIs.

**File conventions**: See [type-safe-agents.md](references/type-safe-agents.md) for where to save agents and tools.

**Type Safety**: When consuming agents with `useChat`, always use `InferAgentUIMessage<typeof agent>` for type-safe tool results. See [reference](references/type-safe-agents.md).

### Consuming Agents (Framework-Specific)

Before implementing agent consumption:

1. Check `package.json` to detect the project's framework/stack
2. Search documentation for the framework's quickstart guide
3. Follow the framework-specific patterns for streaming, API routes, and client integration

## References

- [Common Errors](references/common-errors.md) - Renamed parameters reference (parameters → inputSchema, etc.)
- [Type-Safe Agents with useChat](references/type-safe-agents.md) - End-to-end type safety with InferAgentUIMessage
- [DevTools](references/devtools.md) - Set up local debugging and observability (development only)
