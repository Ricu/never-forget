import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from "@/app/theme"

function ThemeConsumer() {
  const { resolvedTheme, setTheme, theme } = useTheme()

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme("light")} type="button">
        Light
      </button>
      <button onClick={() => setTheme("dark")} type="button">
        Dark
      </button>
    </div>
  )
}

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let currentMatches = matches

  const mediaQueryList = {
    addEventListener: vi.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
    ),
    matches: currentMatches,
    media: "(prefers-color-scheme: dark)",
    removeEventListener: vi.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
    ),
  }

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList),
  )

  return {
    setMatches(nextMatches: boolean) {
      currentMatches = nextMatches
      mediaQueryList.matches = nextMatches
      listeners.forEach((listener) => {
        listener({
          matches: currentMatches,
          media: mediaQueryList.media,
        } as MediaQueryListEvent)
      })
    },
  }
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove("dark")
    document.documentElement.style.colorScheme = ""
    delete document.documentElement.dataset.theme
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("prefers a stored theme over the system theme", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark")
    mockMatchMedia(false)

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark")
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark")
      expect(document.documentElement).toHaveClass("dark")
    })
  })

  it("uses the system theme by default and persists that choice", async () => {
    mockMatchMedia(true)

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("system")
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark")
      expect(document.documentElement).toHaveClass("dark")
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system")
    })
  })

  it("updates the root theme class and storage when the user changes theme", async () => {
    mockMatchMedia(false)

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Dark" }))

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark")
      expect(document.documentElement).toHaveClass("dark")
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    })

    fireEvent.click(screen.getByRole("button", { name: "Light" }))

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light")
      expect(document.documentElement).not.toHaveClass("dark")
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
    })
  })
})
