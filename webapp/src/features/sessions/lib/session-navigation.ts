export const NEW_CAPTURE_SESSION_ID = "new"

export type NewCaptureSessionLocationState = {
  kind: "new-capture-session"
  initialText: string
}

export function buildNewCaptureSessionLocationState(
  initialText: string,
): NewCaptureSessionLocationState {
  return {
    kind: "new-capture-session",
    initialText,
  }
}

export function isNewCaptureSessionLocationState(
  value: unknown,
): value is NewCaptureSessionLocationState {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Partial<NewCaptureSessionLocationState>

  return (
    candidate.kind === "new-capture-session" &&
    typeof candidate.initialText === "string"
  )
}
