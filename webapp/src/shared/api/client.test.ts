import { describe, expect, it, vi } from "vitest"

import { buildApiUrl } from "@/shared/api/client"

describe("buildApiUrl", () => {
  it("uses the default backend base URL for relative paths", () => {
    expect(buildApiUrl("/api/health")).toBe("http://127.0.0.1:8000/api/health")
  })

  it("normalizes missing leading slashes", () => {
    expect(buildApiUrl("api/health")).toBe("http://127.0.0.1:8000/api/health")
  })

  it("prefers the configured backend base URL", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:9000")

    expect(buildApiUrl("/api/health")).toBe("http://127.0.0.1:9000/api/health")
  })
})
