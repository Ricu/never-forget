---
name: building-pydantic-ai-agents
description: Build AI agents with Pydantic AI — tools, capabilities (including on-demand loading), structured output, streaming, testing, and multi-agent patterns. Use when the user mentions Pydantic AI, imports pydantic_ai, or asks to build an AI agent, add tools/capabilities, defer capability loading, stream output, define agents from YAML, or test agent behavior. Also use for coordinating the agent i/o with the frontend.
license: MIT
compatibility: Requires Python 3.10+
metadata:
  version: "1.1.0"
  author: pydantic
---

# Building AI Agents with Pydantic AI

Pydantic AI is a Python agent framework for building production-grade Generative AI applications.
This skill provides patterns, architecture guidance, and tested code examples for building applications with Pydantic AI.

## Task Routing Table

Load only the most relevant reference first. Read additional references only if the task spans multiple areas.

| I want to... | Reference |
|---|---|
| Create/configure agents, choose output types, use deps, define specs, or pick run methods | [Agents Core](./references/AGENTS-CORE.md) |
| Bundle reusable behavior or intercept lifecycle events | [Capabilities and Hooks](./references/CAPABILITIES-AND-HOOKS.md) |
| Decide what should load eagerly vs on demand, apply progressive disclosure, defer capability loading, or explain `load_capability` | [Capabilities on Demand](./references/ON-DEMAND-CAPABILITIES.md) |
| Add function tools, toolsets, MCP servers, or explicit search tools | [Tools Core](./references/TOOLS-CORE.md) |
| Use provider-native web search, web fetch, or code execution | [Native Tools](./references/NATIVE-TOOLS.md) |
| Use advanced tool features such as approval, retries, `ToolReturn`, validators, timeouts, or tool search | [Tools Advanced](./references/TOOLS-ADVANCED.md) |
| Work with multimodal input, message history, or context trimming | [Input and History](./references/INPUT-AND-HISTORY.md) |
| Test or debug agent behavior | [Testing and Debugging](./references/TESTING-AND-DEBUGGING.md) |
| Coordinate multiple agents or build graph workflows | [Orchestration and Integrations](./references/ORCHESTRATION-AND-INTEGRATIONS.md#coordinate-multiple-agents) |
| Call the model directly, expose A2A, use durable execution, embeddings, evals, or third-party integrations | [Orchestration and Integrations](./references/ORCHESTRATION-AND-INTEGRATIONS.md) |
| Compare abstractions, output modes, decorators, or model-string patterns | [Architecture and Decision Guide](./references/ARCHITECTURE.md) |
| Follow an older link into `COMMON-TASKS.md` | [Task Reference Map](./references/COMMON-TASKS.md) |
| Integrating with the AI SDK UI | [UI Transport](./references/UI-TRANSPORT.md) |

## Architecture and Decisions

Load [Architecture and Decision Guide](./references/ARCHITECTURE.md) only when the user is choosing between abstractions or wants comparison tables and decision trees:

| Topic | What it covers |
|---|---|
| Decision Trees | Tool registration, output modes, multi-agent patterns, capabilities, testing approaches, extensibility |
| Comparison Tables | Output modes, model provider prefixes, tool decorators, built-in capabilities, agent methods |
| Architecture Overview | Execution flow, generic types, construction patterns, lifecycle hooks, model string format |

**Quick reference — model string format:** `"provider:model-name"` (e.g., `"openai:gpt-5.2"`, `"anthropic:claude-sonnet-4-6"`, `"google:gemini-3-pro-preview"`)

**Quick reference — key agent methods:** `run()`, `run_sync()`, `run_stream()`, `run_stream_sync()`, `run_stream_events()`, `iter()`

## Key Practices

- **Python 3.10+** compatibility required
- **Progressive disclosure by default**: For every capability, explicitly consider whether `defer_loading=True` would benefit the agent before choosing eager loading. Do not eagerly load specialist instructions, rarely used tool schemas, or domain context unless the model needs them on most turns. Prefer capabilities on demand for named instruction+tool bundles, and tool search for large flat tool catalogs.
- **Observability**: Pydantic AI has first-class integration with Logfire for tracing agent runs, tool calls, and model requests. Add it with `logfire.instrument_pydantic_ai()`. For deeper HTTP-level visibility, `logfire.instrument_httpx(capture_all=True)` captures the exact payloads sent to model providers.
- **Testing**: Use `TestModel` for deterministic tests, `FunctionModel` for custom logic

## Common Gotchas

These are mistakes agents commonly make with Pydantic AI. Getting these wrong produces silent failures or confusing errors.

- **`@agent.tool` requires `RunContext` as first param**; `@agent.tool_plain` must **not** have it. Mixing these up causes runtime errors. Use `tool_plain` when you don't need deps, usage, or messages.
- **Model strings need the provider prefix**: `'openai:gpt-5.2'` not `'gpt-5.2'`. Without the prefix, Pydantic AI can't resolve the provider.
- **`TestModel` requires `agent.override()`**: Don't set `agent.model` directly. Always use the context manager: `with agent.override(model=TestModel()):`.
- **`str` in output_type allows plain text to end the run**: If your union includes `str` (or no `output_type` is set), the model can return plain text instead of structured output. Omit `str` from the union to force tool-based output.
- **Hook decorator names on `.on` don't repeat `on_`**: Use `hooks.on.run_error` and `hooks.on.model_request_error` — not `hooks.on.on_run_error`.
- **`history_processors` is deprecated; use `capabilities=[ProcessHistory(p), ...]`**, or hook `before_model_request` directly via `capabilities=[Hooks(before_model_request=fn)]`. `ProcessHistory` is a thin wrapper around that hook — the hook itself is the underlying primitive. The kwarg still works in 1.x but emits a `PydanticAIDeprecationWarning` and will be removed in v2.