import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { CapturePage } from "@/features/capture/routes/capture-page"

describe("CapturePage", () => {
  it("renders the stripped-down capture surface without the old info panel", () => {
    render(
      <MemoryRouter>
        <CapturePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "Capture" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "Capture prompt" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("One fresh prompt")).not.toBeInTheDocument()
    expect(screen.queryByText("Session thread first")).not.toBeInTheDocument()
    expect(screen.queryByText("No continuation yet")).not.toBeInTheDocument()
  })
})
