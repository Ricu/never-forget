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
    <Conversation className="min-h-[26rem]">
      <ConversationContent className="px-0 py-2 sm:px-0">
        {messages.length === 0 && !showPendingAssistant ? (
          <ConversationEmptyState
            description="Start from the capture page to open a new session thread."
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
  )
}

function PendingAssistantRow() {
  return (
    <Message from="assistant">
      <MessageContent className="text-muted-foreground">
        <div className="flex items-center gap-3 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      </MessageContent>
    </Message>
  )
}
