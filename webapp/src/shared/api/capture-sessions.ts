import type { UIMessage } from "ai"

import { buildApiUrl } from "@/shared/api/client"

export type CaptureSessionStatus =
  | "processing_underway"
  | "input_required"
  | "complete"
  | "failed"

export type CaptureSessionRecord = {
  id: string
  source_type: string
  status: CaptureSessionStatus
  transcript: string
  created_at: string
  updated_at: string
  ui_messages: UIMessage[]
}

export async function getCaptureSession(
  sessionId: string,
): Promise<CaptureSessionRecord> {
  const response = await fetch(
    buildApiUrl(`/api/capture-sessions/${sessionId}`),
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Capture session not found.")
    }

    throw new Error(
      `Capture session request failed with status ${response.status}.`,
    )
  }

  return (await response.json()) as CaptureSessionRecord
}
