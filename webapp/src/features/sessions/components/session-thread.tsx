import type { UIMessage } from "ai"
import { LoaderCircle, MessageSquareDashed } from "lucide-react"

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"
import { MessagePartsRenderer } from "@/features/sessions/components/message-parts-renderer"

type SessionThreadProps = {
  messages: UIMessage[]
  status?: "submitted" | "streaming" | "ready" | "error"
  isLiveSession?: boolean
}

export function SessionThread({
  messages,
  status,
  isLiveSession = false,
}: SessionThreadProps) {
  const hasAssistantMessage = messages.some(
    (message) => message.role === "assistant",
  )

  const showPendingAssistant =
    isLiveSession &&
    (status === "submitted" || (status === "streaming" && !hasAssistantMessage))

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.6),transparent)]" />

      <Conversation className="min-h-[26rem]">
        <ConversationContent className="gap-6 px-4 py-5 sm:px-6 sm:py-6">
          {messages.length === 0 && !showPendingAssistant ? (
            <ConversationEmptyState
              description="Start from the capture interface to open a new session thread."
              icon={<MessageSquareDashed className="h-10 w-10" />}
              title="No session messages yet"
            />
          ) : null}

          {messages.map((message) => (
            <MessagePartsRenderer key={message.id} message={message} />
          ))}

          {showPendingAssistant ? <PendingAssistantRow /> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  )
}

function PendingAssistantRow() {
  return (
    <Message from="assistant">
      <MessageContent className="w-full max-w-xl rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>Assistant response is connecting.</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-2/3 rounded-full bg-white/10" />
          <div className="h-2.5 w-[92%] rounded-full bg-white/8" />
          <div className="h-2.5 w-1/2 rounded-full bg-white/8" />
        </div>
      </MessageContent>
    </Message>
  )
}
