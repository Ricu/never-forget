import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"

import { SessionPageHeader } from "@/features/sessions/components/session-page-header"
import { SessionStateNotice } from "@/features/sessions/components/session-state-notice"
import { SessionThread } from "@/features/sessions/components/session-thread"
import {
  NEW_CAPTURE_SESSION_ID,
  isNewCaptureSessionLocationState,
} from "@/features/sessions/lib/session-navigation"
import {
  getCaptureSession,
  type CaptureSessionStatus,
} from "@/shared/api/capture-sessions"
import { buildApiUrl } from "@/shared/api/client"
import { Button } from "@/shared/ui/button"

export function SessionPage() {
  const { sessionId: routeSessionId = NEW_CAPTURE_SESSION_ID } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const routeState = isNewCaptureSessionLocationState(location.state)
    ? location.state
    : null

  const isNewSessionRoute = routeSessionId === NEW_CAPTURE_SESSION_ID
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(
    isNewSessionRoute ? null : routeSessionId,
  )
  const [liveChatId] = useState(() => `capture-${crypto.randomUUID()}`)
  const hasStartedInitialSubmissionRef = useRef(false)
  const [transport] = useState(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: buildApiUrl("/api/capture-sessions/text/stream"),
        fetch: async (input, init) => {
          const response = await fetch(input, init)
          const captureSessionId = response.headers.get("x-capture-session-id")

          if (captureSessionId) {
            startTransition(() => {
              setResolvedSessionId((currentSessionId) => {
                if (currentSessionId) {
                  return currentSessionId
                }

                return captureSessionId
              })
            })
          }

          return response
        },
      }),
  )

  const actualSessionId = isNewSessionRoute ? resolvedSessionId : routeSessionId

  const { clearError, error, messages, sendMessage, status } = useChat({
    id: liveChatId,
    onError: () => {
      if (!actualSessionId) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: ["capture-session", actualSessionId],
      })
    },
    onFinish: () => {
      if (!actualSessionId) {
        return
      }

      void queryClient.invalidateQueries({
        queryKey: ["capture-session", actualSessionId],
      })
    },
    transport,
  })

  const sessionQuery = useQuery({
    enabled: Boolean(actualSessionId),
    queryFn: () => getCaptureSession(actualSessionId!),
    queryKey: ["capture-session", actualSessionId],
  })

  const startInitialCapture = useEffectEvent(async () => {
    if (!routeState) {
      return
    }

    clearError()
    await sendMessage({ text: routeState.initialText })
  })

  const syncResolvedRoute = useEffectEvent((sessionId: string) => {
    navigate(`/sessions/${sessionId}`, {
      replace: true,
      state: null,
    })
  })

  useEffect(() => {
    if (
      !isNewSessionRoute ||
      !routeState ||
      hasStartedInitialSubmissionRef.current
    ) {
      return
    }

    hasStartedInitialSubmissionRef.current = true
    void startInitialCapture()
  }, [isNewSessionRoute, routeState])

  useEffect(() => {
    if (!isNewSessionRoute || !resolvedSessionId) {
      return
    }

    syncResolvedRoute(resolvedSessionId)
  }, [isNewSessionRoute, resolvedSessionId])

  const persistedStatus = sessionQuery.data?.status
  const showLiveMessages =
    isNewSessionRoute ||
    status === "submitted" ||
    status === "streaming" ||
    messages.length > 0

  const displayMessages =
    showLiveMessages && messages.length > 0
      ? messages
      : (sessionQuery.data?.ui_messages ?? [])

  const notice = buildSessionNotice({
    actualSessionId,
    errorMessage: error ? getSessionErrorMessage(error) : null,
    hasRouteState: routeState !== null,
    isNewSessionRoute,
    isQueryError: sessionQuery.isError,
    persistedStatus,
  })

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-8">
      <SessionPageHeader sessionId={actualSessionId} />

      {notice ? (
        <div className="space-y-3">
          <SessionStateNotice
            description={notice.description}
            pending={notice.pending}
            title={notice.title}
            tone={notice.tone}
          />
          {notice.showBackToCapture ? (
            <Button asChild size="sm" variant="secondary">
              <Link to="/capture">Open capture interface</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <SessionThread
        isLiveSession={showLiveMessages}
        messages={displayMessages}
        status={status}
      />
    </section>
  )
}

type BuildSessionNoticeOptions = {
  actualSessionId: string | null
  errorMessage: string | null
  hasRouteState: boolean
  isNewSessionRoute: boolean
  isQueryError: boolean
  persistedStatus: CaptureSessionStatus | undefined
}

function buildSessionNotice({
  actualSessionId,
  errorMessage,
  hasRouteState,
  isNewSessionRoute,
  isQueryError,
  persistedStatus,
}: BuildSessionNoticeOptions) {
  if (isNewSessionRoute && !hasRouteState) {
    return {
      description: "New sessions start from the capture page.",
      pending: false,
      showBackToCapture: true,
      title: "Start from Capture.",
      tone: "error" as const,
    }
  }

  if (errorMessage && !actualSessionId) {
    return {
      description: errorMessage,
      pending: false,
      showBackToCapture: true,
      title: "Couldn't start this capture.",
      tone: "error" as const,
    }
  }

  if (errorMessage && actualSessionId) {
    return {
      description: errorMessage,
      pending: false,
      showBackToCapture: false,
      title: "The response was interrupted.",
      tone: "error" as const,
    }
  }

  if (persistedStatus === "failed") {
    return {
      description: "The saved thread is still visible below.",
      pending: false,
      showBackToCapture: false,
      title: "This capture failed.",
      tone: "error" as const,
    }
  }

  if (persistedStatus === "processing_underway") {
    return {
      description: "The saved response is not ready yet.",
      pending: true,
      showBackToCapture: false,
      title: "Still processing.",
      tone: "neutral" as const,
    }
  }

  if (isQueryError && actualSessionId) {
    return {
      description: "The saved session could not be fetched.",
      pending: false,
      showBackToCapture: false,
      title: "Couldn't load this session.",
      tone: "error" as const,
    }
  }

  return null
}

function getSessionErrorMessage(error: Error): string {
  try {
    const parsed = JSON.parse(error.message) as {
      detail?: string | { msg?: string }[]
    }

    if (typeof parsed.detail === "string") {
      return parsed.detail
    }
  } catch {
    return error.message
  }

  return error.message
}
