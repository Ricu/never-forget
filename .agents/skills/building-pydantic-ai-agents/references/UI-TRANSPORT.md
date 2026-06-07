The relative references on this site are broken.

# UI Event Streams

If you're building a chat app or other interactive frontend for an AI agent, your backend will need to receive agent run input (like a chat message or complete [message history](../message-history.md)) from the frontend, and will need to stream the [agent's events](../agent.md#streaming-all-events) (like text, thinking, and tool calls) to the frontend so that the user knows what's happening in real time.

While your frontend could use Pydantic AI's [`ModelRequest`][pydantic_ai.messages.ModelRequest] and [`AgentStreamEvent`][pydantic_ai.messages.AgentStreamEvent] directly, you'll typically want to use a UI event stream protocol that's natively supported by your frontend framework.

Pydantic AI natively supports two UI event stream protocols:

- [Agent-User Interaction (AG-UI) Protocol](./ag-ui.md)
- [Vercel AI Data Stream Protocol](./vercel-ai.md)

These integrations are implemented as subclasses of the abstract [`UIAdapter`][pydantic_ai.ui.UIAdapter] class, so they also serve as a reference for integrating with other UI event stream protocols.

## Usage

The protocol-specific [`UIAdapter`][pydantic_ai.ui.UIAdapter] subclass (i.e. [`AGUIAdapter`][pydantic_ai.ui.ag_ui.AGUIAdapter] or [`VercelAIAdapter`][pydantic_ai.ui.vercel_ai.VercelAIAdapter]) is responsible for transforming agent run input received from the frontend into arguments for [`Agent.run_stream_events()`](../agent.md#running-agents), running the agent, and then transforming Pydantic AI events into protocol-specific events. The event stream transformation is handled by a protocol-specific [`UIEventStream`][pydantic_ai.ui.UIEventStream] subclass, but you typically won't use this directly.

If you're using a Starlette-based web framework like FastAPI, you can use the [`UIAdapter.dispatch_request()`][pydantic_ai.ui.UIAdapter.dispatch_request] class method from an endpoint function to directly handle a request and return a streaming response of protocol-specific events. This is demonstrated in the next section.

If you're using a web framework not based on Starlette (e.g. Django or Flask) or need fine-grained control over the input or output, you can create a `UIAdapter` instance and directly use its methods. This is demonstrated in "Advanced Usage" section below.

### Usage with Starlette/FastAPI

Besides the request, [`UIAdapter.dispatch_request()`][pydantic_ai.ui.UIAdapter.dispatch_request] takes the agent, the same optional arguments as [`Agent.run_stream_events()`](../agent.md#running-agents), and an optional `on_complete` callback function that receives the completed [`AgentRunResult`][pydantic_ai.agent.AgentRunResult] and can optionally yield additional protocol-specific events.

!!! note
    These examples use the `VercelAIAdapter`, but the same patterns apply to all `UIAdapter` subclasses.

```py {title="dispatch_request.py"}
from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import Response

from pydantic_ai import Agent
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

agent = Agent('openai:gpt-5.2')

app = FastAPI()

@app.post('/chat')
async def chat(request: Request) -> Response:
    return await VercelAIAdapter.dispatch_request(request, agent=agent)
```

### Advanced Usage

If you're using a web framework not based on Starlette (e.g. Django or Flask) or need fine-grained control over the input or output, you can create a `UIAdapter` instance and directly use its methods, which can be chained to accomplish the same thing as the `UIAdapter.dispatch_request()` class method shown above:

1. The [`UIAdapter.build_run_input()`][pydantic_ai.ui.UIAdapter.build_run_input] class method takes the request body as bytes and returns a protocol-specific run input object, which you can then pass to the [`UIAdapter()`][pydantic_ai.ui.UIAdapter] constructor along with the agent.
    - You can also use the [`UIAdapter.from_request()`][pydantic_ai.ui.UIAdapter.from_request] class method to build an adapter directly from a Starlette/FastAPI request.
2. The [`UIAdapter.run_stream()`][pydantic_ai.ui.UIAdapter.run_stream] method runs the agent and returns a stream of protocol-specific events. It supports the same optional arguments as [`Agent.run_stream_events()`](../agent.md#running-agents) and an optional `on_complete` callback function that receives the completed [`AgentRunResult`][pydantic_ai.agent.AgentRunResult] and can optionally yield additional protocol-specific events.
    - You can also use [`UIAdapter.run_stream_native()`][pydantic_ai.ui.UIAdapter.run_stream_native] to run the agent and return a stream of Pydantic AI events instead, which can then be transformed into protocol-specific events using [`UIAdapter.transform_stream()`][pydantic_ai.ui.UIAdapter.transform_stream].
3. The [`UIAdapter.encode_stream()`][pydantic_ai.ui.UIAdapter.encode_stream] method encodes the stream of protocol-specific events as SSE (HTTP Server-Sent Events) strings, which you can then return as a streaming response.
    - You can also use [`UIAdapter.streaming_response()`][pydantic_ai.ui.UIAdapter.streaming_response] to generate a Starlette/FastAPI streaming response directly from the protocol-specific event stream returned by `run_stream()`.

!!! note
    This example uses FastAPI, but can be modified to work with any web framework.

```py {title="run_stream.py"}
import json
from http import HTTPStatus

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import Response, StreamingResponse
from pydantic import ValidationError

from pydantic_ai import Agent
from pydantic_ai.ui import SSE_CONTENT_TYPE
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

agent = Agent('openai:gpt-5.2')

app = FastAPI()


@app.post('/chat')
async def chat(request: Request) -> Response:
    accept = request.headers.get('accept', SSE_CONTENT_TYPE)
    try:
        run_input = VercelAIAdapter.build_run_input(await request.body())
    except ValidationError as e:
        return Response(
            content=json.dumps(e.json()),
            media_type='application/json',
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        )

    adapter = VercelAIAdapter(agent=agent, run_input=run_input, accept=accept)
    event_stream = adapter.run_stream()

    sse_event_stream = adapter.encode_stream(event_stream)
    return StreamingResponse(sse_event_stream, media_type=accept)
```

## Trust model for client-submitted messages

UI adapter endpoints aren't authentication boundaries. Both the AG-UI and Vercel AI protocols are designed around the client transmitting the full conversation history on each request, so anything in `message_history` from the protocol — assistant messages, tool calls, file URLs, tool results — is under the caller's control. Treat the adapter endpoint as an internal backend service, running it inside your own authenticated route handler. See the [AG-UI security considerations](https://learn.microsoft.com/en-us/agent-framework/integrations/ag-ui/security-considerations) page for more on the deployment model both protocols assume.

The adapters apply a few defaults so that the authoritative state stays on your side:

- **System prompts** — client-submitted [`SystemPromptPart`][pydantic_ai.messages.SystemPromptPart]s are stripped by default and replaced with the agent's configured prompt. Control with [`UIAdapter.manage_system_prompt`][pydantic_ai.ui.UIAdapter.manage_system_prompt]; see each adapter's docs for details.
- **Dangling tool calls** — if the client-submitted history ends in a [`ModelResponse`][pydantic_ai.messages.ModelResponse] with unresolved [`ToolCallPart`][pydantic_ai.messages.ToolCallPart]s and no matching `deferred_tool_results`, the tool calls are dropped with a warning so the agent doesn't execute tool calls that the model never emitted. For human-in-the-loop resumption, pass explicit `deferred_tool_results` to the run method — tool calls resolved by those results are kept.
- **File URL schemes** — only `http` and `https` are accepted by default for [`FileUrl`][pydantic_ai.messages.FileUrl] parts in client-submitted messages. Non-HTTP schemes like `s3://` or `gs://` are dropped, since they cause the provider to fetch the object using your server's IAM role or service account. See [`UIAdapter.allowed_file_url_schemes`][pydantic_ai.ui.UIAdapter.allowed_file_url_schemes].
- **File URL download mode** — [`FileUrl.force_download`][pydantic_ai.messages.FileUrl.force_download] values other than `False` are reset to `False` by default on client-submitted messages. This prevents clients from forcing the server to fetch a URL, or using `'allow-local'` to opt out of the SSRF private-IP block. After auditing your frontend, opt into additional values with [`UIAdapter.allowed_file_url_force_download`][pydantic_ai.ui.UIAdapter.allowed_file_url_force_download].

For stricter conversation integrity (e.g. ensuring prior assistant turns and tool returns match what the server actually produced), persist the history server-side keyed by the thread/session ID and pass it to the adapter via `message_history` — caller-supplied history is trusted as coming from server-side persistence and isn't subject to this sanitization.

# Vercel AI Data Stream Protocol

Pydantic AI natively supports the [Vercel AI Data Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#data-stream-protocol) to receive agent run input from, and stream events to, a frontend using [AI SDK UI](https://ai-sdk.dev/docs/ai-sdk-ui/overview) hooks like [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat). You can optionally use [AI Elements](https://ai-sdk.dev/elements) for pre-built UI components.

!!! note
    By default, the adapter targets AI SDK v5 for backwards compatibility. To use features introduced in AI SDK v6, set `sdk_version=6` on the adapter.

## Usage

The [`VercelAIAdapter`][pydantic_ai.ui.vercel_ai.VercelAIAdapter] class is responsible for transforming agent run input received from the frontend into arguments for [`Agent.run_stream_events()`](../agent.md#running-agents), running the agent, and then transforming Pydantic AI events into Vercel AI events. The event stream transformation is handled by the [`VercelAIEventStream`][pydantic_ai.ui.vercel_ai.VercelAIEventStream] class, but you typically won't use this directly.

If you're using a Starlette-based web framework like FastAPI, you can use the [`VercelAIAdapter.dispatch_request()`][pydantic_ai.ui.UIAdapter.dispatch_request] class method from an endpoint function to directly handle a request and return a streaming response of Vercel AI events. This is demonstrated in the next section.

If you're using a web framework not based on Starlette (e.g. Django or Flask) or need fine-grained control over the input or output, you can create a `VercelAIAdapter` instance and directly use its methods. This is demonstrated in "Advanced Usage" section below.

### Usage with Starlette/FastAPI

Besides the request, [`VercelAIAdapter.dispatch_request()`][pydantic_ai.ui.UIAdapter.dispatch_request] takes the agent, the same optional arguments as [`Agent.run_stream_events()`](../agent.md#running-agents), and an optional `on_complete` callback function that receives the completed [`AgentRunResult`][pydantic_ai.agent.AgentRunResult] and can optionally yield additional Vercel AI events.

```py {title="dispatch_request.py"}
from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import Response

from pydantic_ai import Agent
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

agent = Agent('openai:gpt-5.2')

app = FastAPI()

@app.post('/chat')
async def chat(request: Request) -> Response:
    return await VercelAIAdapter.dispatch_request(request, agent=agent)
```

### Advanced Usage

If you're using a web framework not based on Starlette (e.g. Django or Flask) or need fine-grained control over the input or output, you can create a `VercelAIAdapter` instance and directly use its methods, which can be chained to accomplish the same thing as the `VercelAIAdapter.dispatch_request()` class method shown above:

1. The [`VercelAIAdapter.build_run_input()`][pydantic_ai.ui.vercel_ai.VercelAIAdapter.build_run_input] class method takes the request body as bytes and returns a Vercel AI [`RequestData`][pydantic_ai.ui.vercel_ai.request_types.RequestData] run input object, which you can then pass to the [`VercelAIAdapter()`][pydantic_ai.ui.vercel_ai.VercelAIAdapter] constructor along with the agent.
    - You can also use the [`VercelAIAdapter.from_request()`][pydantic_ai.ui.UIAdapter.from_request] class method to build an adapter directly from a Starlette/FastAPI request.
2. The [`VercelAIAdapter.run_stream()`][pydantic_ai.ui.UIAdapter.run_stream] method runs the agent and returns a stream of Vercel AI events. It supports the same optional arguments as [`Agent.run_stream_events()`](../agent.md#running-agents) and an optional `on_complete` callback function that receives the completed [`AgentRunResult`][pydantic_ai.agent.AgentRunResult] and can optionally yield additional Vercel AI events.
    - You can also use [`VercelAIAdapter.run_stream_native()`][pydantic_ai.ui.UIAdapter.run_stream_native] to run the agent and return a stream of Pydantic AI events instead, which can then be transformed into Vercel AI events using [`VercelAIAdapter.transform_stream()`][pydantic_ai.ui.UIAdapter.transform_stream].
3. The [`VercelAIAdapter.encode_stream()`][pydantic_ai.ui.UIAdapter.encode_stream] method encodes the stream of Vercel AI events as SSE (HTTP Server-Sent Events) strings, which you can then return as a streaming response.
    - You can also use [`VercelAIAdapter.streaming_response()`][pydantic_ai.ui.UIAdapter.streaming_response] to generate a Starlette/FastAPI streaming response directly from the Vercel AI event stream returned by `run_stream()`.

!!! note
    This example uses FastAPI, but can be modified to work with any web framework.

```py {title="run_stream.py"}
import json
from http import HTTPStatus

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import Response, StreamingResponse
from pydantic import ValidationError

from pydantic_ai import Agent
from pydantic_ai.ui import SSE_CONTENT_TYPE
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

agent = Agent('openai:gpt-5.2')

app = FastAPI()


@app.post('/chat')
async def chat(request: Request) -> Response:
    accept = request.headers.get('accept', SSE_CONTENT_TYPE)
    try:
        run_input = VercelAIAdapter.build_run_input(await request.body())
    except ValidationError as e:
        return Response(
            content=json.dumps(e.json()),
            media_type='application/json',
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        )

    adapter = VercelAIAdapter(agent=agent, run_input=run_input, accept=accept)
    event_stream = adapter.run_stream()

    sse_event_stream = adapter.encode_stream(event_stream)
    return StreamingResponse(sse_event_stream, media_type=accept)
```

### Data Chunks

Pydantic AI tools can send [Vercel AI data stream chunks](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#data-stream-protocol) by returning a
[`ToolReturn`](../tools-advanced.md#advanced-tool-returns) object with a data-carrying chunk
(or a list of chunks) as `metadata`.
The supported chunk types are [`DataChunk`][pydantic_ai.ui.vercel_ai.response_types.DataChunk],
[`SourceUrlChunk`][pydantic_ai.ui.vercel_ai.response_types.SourceUrlChunk],
[`SourceDocumentChunk`][pydantic_ai.ui.vercel_ai.response_types.SourceDocumentChunk],
and [`FileChunk`][pydantic_ai.ui.vercel_ai.response_types.FileChunk].
This is useful for attaching structured data to the frontend alongside the tool result, such as source URLs or custom data payloads.

```python {title="vercel_ai_tool_chunks.py"}
from pydantic_ai import Agent, ToolReturn
from pydantic_ai.ui.vercel_ai.response_types import DataChunk, SourceUrlChunk

agent = Agent('openai:gpt-5.2')


@agent.tool_plain
async def search_docs(query: str) -> ToolReturn:
    return ToolReturn(
        return_value=f'Found 2 results for "{query}"',
        metadata=[
            SourceUrlChunk(
                source_id='doc-1',
                url='https://example.com/docs/intro',
                title='Introduction',
            ),
            DataChunk(
                type='data-search-results',
                data={'query': query, 'count': 2},
            ),
        ],
    )
```

!!! note
    Protocol-control chunks such as `StartChunk`, `FinishChunk`, `StartStepChunk`, or `FinishStepChunk` are automatically filtered out — only the four data-carrying chunk types listed above are forwarded to the stream and preserved in `dump_messages`.

## Message metadata

[`VercelAIAdapter.dump_messages`][pydantic_ai.ui.vercel_ai.VercelAIAdapter.dump_messages] writes [`ModelRequest.metadata`][pydantic_ai.messages.ModelRequest.metadata] and [`ModelResponse.metadata`][pydantic_ai.messages.ModelResponse.metadata] into Vercel AI [`UIMessage.metadata`](https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata), and stores the message `timestamp` under a reserved `pydantic_ai` key so it survives the round-trip. [`VercelAIAdapter.load_messages`][pydantic_ai.ui.vercel_ai.VercelAIAdapter.load_messages] restores it on the way back.

When streaming, the timestamp is also emitted as a Vercel AI `message-metadata` chunk after the final step, so frontends using AI SDK UI can persist it with the assistant message. Request-side messages have no analogous chunk — frontends rebuilding history purely from streamed chunks see timestamps only on assistant responses, whereas `dump_messages` populates both sides.

`UIMessage.metadata` is fully client-controlled, so only `timestamp` is round-tripped: server-side fields such as `usage`, `model_name`, and `provider_*` are deliberately excluded — dumping them could leak infrastructure details, and restoring them would trust client-submitted history for values the server owns. Broadening the round-trip behind an explicit user-controlled opt-in is tracked in [issue #5174](https://github.com/pydantic/pydantic-ai/issues/5174).

## Trust model

Vercel AI's request `messages` array is fully client-controlled, and the protocol round-trips approval responses and tool results through the message history. The [`VercelAIAdapter`][pydantic_ai.ui.vercel_ai.VercelAIAdapter] applies defaults to strip untrusted parts before the agent runs — see Trust model for client-submitted messages in the UI adapter overview.

## Tool Approval

!!! note
    Tool approval requires AI SDK UI v6 or later on the frontend.

Pydantic AI supports human-in-the-loop tool approval workflows with AI SDK UI, allowing users to approve or deny tool executions before they run. See the [deferred tool calls documentation](./TOOLS-ADVANCED.md) for details on setting up tools that require approval.

To enable tool approval streaming, pass `sdk_version=6` to `dispatch_request`:

```py {test="skip" lint="skip"}
@app.post('/chat')
async def chat(request: Request) -> Response:
    return await VercelAIAdapter.dispatch_request(request, agent=agent, sdk_version=6)
```

When `sdk_version=6`, the adapter will:

1. Emit `tool-approval-request` chunks when tools with `requires_approval=True` are called
2. Automatically extract approval responses from follow-up requests
3. Emit `tool-output-denied` chunks for rejected tools

On the frontend, AI SDK UI's [`useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) hook handles the approval flow. You can use the [`Confirmation`](https://ai-sdk.dev/elements/components/confirmation) component from AI Elements for a pre-built approval UI, or build your own using the hook's `addToolApprovalResponse` function.

Tool approval responses are trusted from the request by design, matching the protocol's round-trip through `useChat`'s `addToolApprovalResponse` and the reference Next.js backend. If your application needs the approval decision tied to server-side state rather than the request, intercept [`DeferredToolRequests`][pydantic_ai.DeferredToolRequests], persist the approval IDs server-side, and pass explicit `deferred_tool_results` when resuming.

## Tool input validation

`tool-input-available` is emitted **after** the agent has validated the call against the tool's schema and any custom [`args_validator`](../tools-advanced.md#args-validator), so the chunk only fires once the args are known to be acceptable. The chunk's `input` field carries the raw arguments the model emitted.

When validation fails, the adapter emits `tool-input-error` instead of `tool-input-available`. The chunk carries the same `tool_call_id`, `tool_name`, and `input` (the raw arguments) plus an `error_text` field rendered from the retry prompt that will be sent back to the model. The agent will retry the call (subject to the tool's `retries` setting) and emit a new `tool-input-(available|error)` for each attempt.

## System prompts and instructions

Pydantic AI supports two ways to provide guidance to the model: [`system_prompt`](../agent.md#system-prompts) (stored in the message history as [`SystemPromptPart`][pydantic_ai.messages.SystemPromptPart]s) and [`instructions`](../agent.md#instructions) (injected fresh on every request, never persisted). When you control the server side, `instructions` is the recommended default.

The rest of this section only matters if you use `system_prompt`. If you only use `instructions`, there's nothing to configure — they're always applied regardless of the frontend message history.

For `system_prompt`, you choose who owns it with the `manage_system_prompt` parameter on [`VercelAIAdapter`][pydantic_ai.ui.vercel_ai.VercelAIAdapter]:

- `'server'` (default): the agent's configured `system_prompt` is authoritative. Any system message sent by the frontend is stripped with a warning (a malicious client could otherwise inject arbitrary instructions via crafted API requests), and the agent's own system prompt is reinjected at the head of the first request via the [`ReinjectSystemPrompt`][pydantic_ai.capabilities.ReinjectSystemPrompt] capability.
- `'client'`: the frontend owns the system prompt. Frontend system messages are preserved as-is, and the agent's configured `system_prompt` is not injected — the caller is fully responsible for sending it on every turn if desired. To opt into fallback-to-configured behavior, add the [`ReinjectSystemPrompt`][pydantic_ai.capabilities.ReinjectSystemPrompt] capability to your agent.

```python {title="vercel_ai_client_managed_system_prompt.py"}
from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import Response

from pydantic_ai import Agent
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

agent = Agent('openai:gpt-5.2')

app = FastAPI()


@app.post('/chat')
async def chat(request: Request) -> Response:
    return await VercelAIAdapter.dispatch_request(
        request, agent=agent, manage_system_prompt='client'
    )
```