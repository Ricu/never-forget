import { isToolUIPart, type UIMessage } from "ai"

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"

type MessagePartsRendererProps = {
  message: UIMessage
}

type MessageBlock =
  | {
      kind: "content"
      parts: UIMessage["parts"]
    }
  | {
      kind: "tool"
      part: ToolPart
    }
  | {
      kind: "step-start"
      key: string
    }

export function MessagePartsRenderer({ message }: MessagePartsRendererProps) {
  const blocks = buildMessageBlocks(message.parts)

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.kind === "content") {
          return (
            <Message from={message.role} key={`${message.id}-content-${index}`}>
              <MessageContent>
                {block.parts.map((part, partIndex) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <MessageResponse
                          isAnimating={part.state === "streaming"}
                          key={`${message.id}-text-${partIndex}`}
                        >
                          {part.text}
                        </MessageResponse>
                      )
                    case "reasoning":
                      return (
                        <div
                          className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3"
                          key={`${message.id}-reasoning-${partIndex}`}
                        >
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Reasoning
                          </p>
                          <MessageResponse
                            className="text-muted-foreground"
                            isAnimating={part.state === "streaming"}
                          >
                            {part.text}
                          </MessageResponse>
                        </div>
                      )
                    case "file":
                      return (
                        <a
                          className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          href={part.url}
                          key={`${message.id}-file-${partIndex}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {part.filename ?? part.mediaType}
                        </a>
                      )
                    case "source-url":
                      return (
                        <a
                          className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                          href={part.url}
                          key={`${message.id}-source-url-${partIndex}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {part.title ?? part.url}
                        </a>
                      )
                    case "source-document":
                      return (
                        <Badge
                          className="w-fit rounded-full px-3 py-1 text-xs font-normal"
                          key={`${message.id}-source-document-${partIndex}`}
                          variant="secondary"
                        >
                          {part.title}
                        </Badge>
                      )
                    default:
                      return null
                  }
                })}
              </MessageContent>
            </Message>
          )
        }

        if (block.kind === "step-start") {
          return (
            <div
              className="flex items-center gap-3 py-1"
              key={`${message.id}-${block.key}`}
            >
              <Separator className="flex-1 bg-white/8" />
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Next step
              </span>
              <Separator className="flex-1 bg-white/8" />
            </div>
          )
        }

        return (
          <div
            className={cn(
              "w-full max-w-[95%]",
              message.role === "user" && "ml-auto",
            )}
            key={`${message.id}-${block.part.toolCallId}`}
          >
            <Tool
              defaultOpen={
                block.part.state === "output-available" ||
                block.part.state === "output-error"
              }
            >
              {block.part.type === "dynamic-tool" ? (
                <ToolHeader
                  state={block.part.state}
                  toolName={block.part.toolName}
                  type={block.part.type}
                />
              ) : (
                <ToolHeader state={block.part.state} type={block.part.type} />
              )}
              <ToolContent>
                {block.part.input !== undefined ? (
                  <ToolInput input={block.part.input} />
                ) : null}
                <ToolOutput
                  errorText={block.part.errorText}
                  output={block.part.output}
                />
              </ToolContent>
            </Tool>
          </div>
        )
      })}
    </div>
  )
}

function buildMessageBlocks(parts: UIMessage["parts"]): MessageBlock[] {
  const blocks: MessageBlock[] = []
  let contentParts: UIMessage["parts"] = []

  for (const part of parts) {
    if (part.type === "step-start") {
      if (contentParts.length > 0) {
        blocks.push({
          kind: "content",
          parts: contentParts,
        })
        contentParts = []
      }

      blocks.push({
        kind: "step-start",
        key: `step-start-${blocks.length}`,
      })
      continue
    }

    if (isToolUIPart(part)) {
      if (contentParts.length > 0) {
        blocks.push({
          kind: "content",
          parts: contentParts,
        })
        contentParts = []
      }

      blocks.push({
        kind: "tool",
        part,
      })
      continue
    }

    contentParts.push(part)
  }

  if (contentParts.length > 0) {
    blocks.push({
      kind: "content",
      parts: contentParts,
    })
  }

  return blocks
}
