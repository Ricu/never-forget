import { render, screen } from "@testing-library/react"
import type { UIMessage } from "ai"
import { describe, expect, it } from "vitest"

import { SessionThread } from "@/features/sessions/components/session-thread"

describe("SessionThread", () => {
  it("renders a minimal assistant-row loading state for live pending responses", () => {
    const messages = [
      {
        id: "user-1",
        parts: [{ state: "done", text: "Remember this.", type: "text" }],
        role: "user",
      },
    ] satisfies UIMessage[]

    render(
      <SessionThread isLiveSession messages={messages} status="submitted" />,
    )

    expect(screen.getByText("Thinking...")).toBeInTheDocument()
    expect(
      screen.queryByText("Assistant response is connecting."),
    ).not.toBeInTheDocument()
  })
})
