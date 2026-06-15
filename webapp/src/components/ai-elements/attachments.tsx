"use client"

import type { FileUIPart, SourceDocumentUIPart } from "ai"
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  Music4Icon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import type { ComponentProps, HTMLAttributes, ReactNode } from "react"
import { createContext, useContext } from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/ui/hover-card"

type AttachmentData = (FileUIPart | SourceDocumentUIPart) & { id?: string }
type AttachmentVariant = "grid" | "inline" | "list"
type MediaCategory =
  | "audio"
  | "document"
  | "image"
  | "source"
  | "unknown"
  | "video"

type AttachmentsContextValue = {
  variant: AttachmentVariant
}

type AttachmentContextValue = {
  data: AttachmentData
  onRemove?: () => void
}

const AttachmentsContext = createContext<AttachmentsContextValue | null>(null)
const AttachmentContext = createContext<AttachmentContextValue | null>(null)

function useAttachmentsContext() {
  return useContext(AttachmentsContext) ?? { variant: "grid" as const }
}

function useAttachmentContext() {
  const context = useContext(AttachmentContext)

  if (!context) {
    throw new Error("Attachment components must be used within Attachment.")
  }

  return context
}

function isFileAttachment(
  data: AttachmentData,
): data is FileUIPart & { id?: string } {
  return data.type === "file"
}

function getMediaCategory(data: AttachmentData): MediaCategory {
  if (data.type === "source-document") {
    return "source"
  }

  if (data.mediaType.startsWith("image/")) {
    return "image"
  }

  if (data.mediaType.startsWith("video/")) {
    return "video"
  }

  if (data.mediaType.startsWith("audio/")) {
    return "audio"
  }

  if (data.mediaType.length > 0) {
    return "document"
  }

  return "unknown"
}

function getAttachmentLabel(data: AttachmentData): string {
  if (data.type === "source-document") {
    return data.filename ?? data.title
  }

  return data.filename ?? "Attachment"
}

function getAttachmentIcon(category: MediaCategory) {
  switch (category) {
    case "image":
      return <ImageIcon className="size-4" />
    case "video":
      return <VideoIcon className="size-4" />
    case "audio":
      return <Music4Icon className="size-4" />
    case "source":
      return <FileTextIcon className="size-4" />
    default:
      return <FileIcon className="size-4" />
  }
}

export type AttachmentsProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AttachmentVariant
}

export function Attachments({
  children,
  className,
  variant = "grid",
  ...props
}: AttachmentsProps) {
  return (
    <AttachmentsContext.Provider value={{ variant }}>
      <div
        className={cn(
          variant === "grid" && "grid grid-cols-2 gap-3 sm:grid-cols-3",
          variant === "inline" && "flex flex-wrap gap-2",
          variant === "list" && "flex flex-col gap-2",
          className,
        )}
        data-slot="attachments"
        data-variant={variant}
        {...props}
      >
        {children}
      </div>
    </AttachmentsContext.Provider>
  )
}

export type AttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: AttachmentData
  onRemove?: () => void
}

export function Attachment({
  children,
  className,
  data,
  onRemove,
  ...props
}: AttachmentProps) {
  const { variant } = useAttachmentsContext()
  const category = getMediaCategory(data)

  return (
    <AttachmentContext.Provider value={{ data, onRemove }}>
      <div
        className={cn(
          "group/attachment relative overflow-hidden border border-border bg-card text-card-foreground",
          variant === "grid" && "flex min-h-32 flex-col gap-2 rounded-xl p-3",
          variant === "inline" &&
            "inline-flex max-w-full items-center gap-2 rounded-full bg-muted/40 px-2.5 py-1 text-xs",
          variant === "list" && "flex items-center gap-3 rounded-lg px-3 py-2",
          category === "source" && variant === "inline" && "bg-secondary/60",
          className,
        )}
        data-media-category={category}
        data-slot="attachment"
        {...props}
      >
        {children}
      </div>
    </AttachmentContext.Provider>
  )
}

export type AttachmentPreviewProps = HTMLAttributes<HTMLDivElement> & {
  fallbackIcon?: ReactNode
}

export function AttachmentPreview({
  className,
  fallbackIcon,
  ...props
}: AttachmentPreviewProps) {
  const { variant } = useAttachmentsContext()
  const { data } = useAttachmentContext()
  const category = getMediaCategory(data)
  const icon = fallbackIcon ?? getAttachmentIcon(category)

  if (variant === "inline") {
    return (
      <div
        className={cn("shrink-0 text-muted-foreground", className)}
        data-slot="attachment-preview"
        {...props}
      >
        {icon}
      </div>
    )
  }

  if (isFileAttachment(data) && category === "image") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-muted/40",
          variant === "grid" ? "aspect-video" : "h-16 w-16 shrink-0",
          className,
        )}
        data-slot="attachment-preview"
        {...props}
      >
        <img
          alt={getAttachmentLabel(data)}
          className="size-full object-cover"
          src={data.url}
        />
      </div>
    )
  }

  if (isFileAttachment(data) && category === "video") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-muted/40",
          variant === "grid" ? "aspect-video" : "h-16 w-16 shrink-0",
          className,
        )}
        data-slot="attachment-preview"
        {...props}
      >
        <video
          className="size-full object-cover"
          muted
          preload="metadata"
          src={data.url}
        />
      </div>
    )
  }

  if (isFileAttachment(data) && category === "audio") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground",
          variant === "grid" ? "aspect-video" : "h-16 w-16 shrink-0",
          className,
        )}
        data-slot="attachment-preview"
        {...props}
      >
        {icon}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground",
        variant === "grid" ? "aspect-video" : "h-10 w-10 shrink-0",
        className,
      )}
      data-slot="attachment-preview"
      {...props}
    >
      {icon}
    </div>
  )
}

export type AttachmentInfoProps = HTMLAttributes<HTMLDivElement> & {
  showMediaType?: boolean
}

export function AttachmentInfo({
  className,
  showMediaType = false,
  ...props
}: AttachmentInfoProps) {
  const { variant } = useAttachmentsContext()
  const { data } = useAttachmentContext()
  const label = getAttachmentLabel(data)
  const mediaLabel =
    data.type === "source-document" ? data.mediaType : data.mediaType || null

  return (
    <div
      className={cn(
        "min-w-0",
        variant === "inline" ? "max-w-48" : "flex-1",
        className,
      )}
      data-slot="attachment-info"
      {...props}
    >
      <p className="truncate text-sm font-medium">{label}</p>
      {showMediaType && mediaLabel ? (
        <p className="truncate text-xs text-muted-foreground">{mediaLabel}</p>
      ) : null}
    </div>
  )
}

export type AttachmentRemoveProps = ComponentProps<typeof Button> & {
  label?: string
}

export function AttachmentRemove({
  className,
  label = "Remove attachment",
  size = "icon-xs",
  variant = "ghost",
  ...props
}: AttachmentRemoveProps) {
  const { onRemove } = useAttachmentContext()

  if (!onRemove) {
    return null
  }

  return (
    <Button
      aria-label={label}
      className={cn(
        "absolute top-2 right-2 opacity-0 transition-opacity group-hover/attachment:opacity-100",
        className,
      )}
      onClick={onRemove}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      <XIcon className="size-3" />
    </Button>
  )
}

export function AttachmentHoverCard({
  ...props
}: ComponentProps<typeof HoverCard>) {
  return <HoverCard {...props} />
}

export function AttachmentHoverCardTrigger({
  ...props
}: ComponentProps<typeof HoverCardTrigger>) {
  return <HoverCardTrigger {...props} />
}

export function AttachmentHoverCardContent({
  ...props
}: ComponentProps<typeof HoverCardContent>) {
  return <HoverCardContent {...props} />
}

export function AttachmentEmpty({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground",
        className,
      )}
      data-slot="attachment-empty"
      {...props}
    />
  )
}
