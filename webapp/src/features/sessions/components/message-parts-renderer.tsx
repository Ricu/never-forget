import { isToolUIPart, type UIMessage } from "ai"

import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool"
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

type AttachmentPart =
  | (Extract<UIMessage["parts"][number], { type: "file" }> & { id: string })
  | (Extract<UIMessage["parts"][number], { type: "source-document" }> & {
      id: string
    })

export function MessagePartsRenderer({ message }: MessagePartsRendererProps) {
  const blocks = buildMessageBlocks(message.parts)

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.kind === "content") {
          const reasoningParts = block.parts.filter(
            (part) => part.type === "reasoning",
          )
          const reasoningText = reasoningParts
            .map((part) => part.text)
            .join("\n\n")
          const isReasoningStreaming = reasoningParts.some(
            (part) => part.state === "streaming",
          )
          const sourceParts = block.parts.filter(
            (part) => part.type === "source-url",
          )
          const attachmentParts = buildAttachmentParts(block.parts, message.id)

          return (
            <div className="space-y-3" key={`${message.id}-content-${index}`}>
              {sourceParts.length > 0 ? (
                <Sources>
                  <SourcesTrigger count={sourceParts.length} />
                  <SourcesContent>
                    {sourceParts.map((part, partIndex) => (
                      <Source
                        href={part.url}
                        key={`${message.id}-source-url-${partIndex}`}
                        title={part.title ?? part.url}
                      />
                    ))}
                  </SourcesContent>
                </Sources>
              ) : null}

              <Message from={message.role}>
                <MessageContent>
                  {reasoningText ? (
                    <Reasoning
                      defaultOpen={isReasoningStreaming}
                      isStreaming={isReasoningStreaming}
                    >
                      <ReasoningTrigger />
                      <ReasoningContent>{reasoningText}</ReasoningContent>
                    </Reasoning>
                  ) : null}

                  {block.parts.map((part, partIndex) => {
                    if (part.type !== "text") {
                      return null
                    }

                    return (
                      <MessageResponse
                        isAnimating={part.state === "streaming"}
                        key={`${message.id}-text-${partIndex}`}
                      >
                        {part.text}
                      </MessageResponse>
                    )
                  })}

                  {attachmentParts.length > 0 ? (
                    <Attachments className="pt-1" variant="inline">
                      {attachmentParts.map((part) => (
                        <Attachment data={part} key={part.id}>
                          <AttachmentPreview />
                          <AttachmentInfo
                            showMediaType={
                              part.type !== "file" || !part.filename
                            }
                          />
                        </Attachment>
                      ))}
                    </Attachments>
                  ) : null}
                </MessageContent>
              </Message>
            </div>
          )
        }

        if (block.kind === "step-start") {
          return (
            <div
              className="flex items-center gap-3 py-1"
              key={`${message.id}-${block.key}`}
            >
              <Separator className="flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">Step</span>
              <Separator className="flex-1 bg-border" />
            </div>
          )
        }

        return (
          <Tool
            defaultOpen={
              block.part.state === "output-available" ||
              block.part.state === "output-error"
            }
            key={`${message.id}-${block.part.toolCallId}`}
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

function buildAttachmentParts(
  parts: UIMessage["parts"],
  messageId: string,
): AttachmentPart[] {
  const attachments: AttachmentPart[] = []

  for (const [partIndex, part] of parts.entries()) {
    if (part.type === "file") {
      attachments.push({
        ...part,
        id: `${messageId}-file-${partIndex}`,
      })
    }

    if (part.type === "source-document") {
      attachments.push({
        ...part,
        id: `${messageId}-source-document-${partIndex}`,
      })
    }
  }

  return attachments
}
