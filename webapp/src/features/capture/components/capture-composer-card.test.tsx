import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CaptureComposerCard } from "@/features/capture/components/capture-composer-card"

describe("CaptureComposerCard", () => {
  it("shows an inline validation error only after an invalid submit", async () => {
    render(<CaptureComposerCard onStartCapture={vi.fn()} />)

    expect(
      screen.queryByText("Enter some text to start a capture session."),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    expect(
      await screen.findByText("Enter some text to start a capture session."),
    ).toBeInTheDocument()
  })

  it("submits trimmed text through onStartCapture", async () => {
    const onStartCapture = vi.fn()

    render(<CaptureComposerCard onStartCapture={onStartCapture} />)

    fireEvent.change(screen.getByRole("textbox", { name: "Capture prompt" }), {
      target: { value: "  Anna's birthday is January 20.  " },
    })

    fireEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(onStartCapture).toHaveBeenCalledWith(
        "Anna's birthday is January 20.",
      )
    })
  })
})
