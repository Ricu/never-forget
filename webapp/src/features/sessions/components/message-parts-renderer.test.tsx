import { fireEvent, render, screen } from "@testing-library/react"
import type { UIMessage } from "ai"
import { describe, expect, it } from "vitest"

import { MessagePartsRenderer } from "@/features/sessions/components/message-parts-renderer"

describe("MessagePartsRenderer", () => {
  it("renders reasoning, sources, and attachments through stock ai-elements primitives", () => {
    const message = {
      id: "assistant-1",
      parts: [
        {
          state: "streaming",
          text: "Checking related memories.",
          type: "reasoning",
        },
        {
          sourceId: "src-1",
          title: "Memory guide",
          type: "source-url",
          url: "https://example.com/memory-guide",
        },
        {
          state: "done",
          text: "I found the relevant memory.",
          type: "text",
        },
        {
          filename: "memory.txt",
          mediaType: "text/plain",
          type: "file",
          url: "https://example.com/memory.txt",
        },
        {
          mediaType: "text/plain",
          sourceId: "doc-1",
          title: "Session transcript",
          type: "source-document",
        },
      ],
      role: "assistant",
    } satisfies UIMessage

    render(<MessagePartsRenderer message={message} />)

    expect(screen.getByText("Thinking...")).toBeInTheDocument()
    expect(screen.getByText("Checking related memories.")).toBeInTheDocument()
    expect(screen.getByText("Used 1 sources")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Used 1 sources" }))

    expect(screen.getByText("Memory guide")).toBeInTheDocument()
    expect(screen.getByText("memory.txt")).toBeInTheDocument()
    expect(screen.getByText("Session transcript")).toBeInTheDocument()
  })
})
