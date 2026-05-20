# Frontend Tech Stack

The frontend is a local-first SPA that talks to a separate Python backend.

| Area | Choice | Notes |
| --- | --- | --- |
| Package manager | `npm` ||
| Build tool | Vite ||
| UI framework | React ||
| Routing | React Router ||
| Types | TypeScript ||
| Styling | Tailwind ||
| Components | `shadcn/ui` + `ai-elements` | Prefer [`ai-elements`](https://elements.ai-sdk.dev/docs) for AI components and build upon `shadcn/ui` for the rest. Only if neither has a fitting base, go custom. |
| State | Zustand | Should be used responsibly. Prefer local component state for local UI state, TanStack Query for server state, and props/context where sufficient. |
| Server-data | TanStack Query ||
| Forms | React Hook Form + Zod ||
| Icons | `lucide-react` ||
| AI Integration Toolkit | Vercel AI SDK UI | Use AI SDK UI only for frontend chat/streaming hooks and UI state. Do not use AI SDK Core for model calls or agent orchestration; that belongs to the Python backend. [AI SDK UI Docs](https://ai-sdk.dev/docs/ai-sdk-ui/overview). [PydanticAI - AI SDK UI Integration Docs](https://pydantic.dev/docs/ai/integrations/ui/vercel-ai/)|
| Agent Stream Protocols | Vercel AI SDK UI data stream protocol | Default protocol for streamed agent interaction. [Docs](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) |
| Linting/formatting | ESLint + Prettier ||

## Notes

* The frontend stack assumes a separate backend API surface for both agent runs and normal read/write endpoints.
* AI SDK UI covers the streamed agent run, but non-agent read/write flows should stay normal HTTP requests. If in doubt surface to the user.
