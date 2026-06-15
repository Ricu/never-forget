import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { SessionPageHeader } from "@/features/sessions/components/session-page-header"

describe("SessionPageHeader", () => {
  it("does not render the old source-type chip", () => {
    render(
      <MemoryRouter>
        <SessionPageHeader sessionId="12345678-session" />
      </MemoryRouter>,
    )

    expect(screen.queryByText("Direct text capture")).not.toBeInTheDocument()
    expect(screen.getByText("12345678")).toBeInTheDocument()
  })

  it("keeps the session id quiet and optional", () => {
    render(
      <MemoryRouter>
        <SessionPageHeader />
      </MemoryRouter>,
    )

    expect(screen.queryByText("12345678")).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: "Capture session" }),
    ).toBeInTheDocument()
  })
})
