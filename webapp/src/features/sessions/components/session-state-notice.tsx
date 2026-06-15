import { AlertTriangle, CircleAlert, LoaderCircle } from "lucide-react"

import { cn } from "@/shared/lib/utils"

type SessionStateNoticeTone = "neutral" | "error"

type SessionStateNoticeProps = {
  title: string
  description: string
  tone?: SessionStateNoticeTone
  pending?: boolean
}

export function SessionStateNotice({
  title,
  description,
  tone = "neutral",
  pending = false,
}: SessionStateNoticeProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-destructive/20 bg-destructive/5 text-foreground"
          : "border-border bg-muted/20 text-foreground",
      )}
    >
      <div
        className={cn(
          "mt-0.5 rounded-full p-1.5",
          tone === "error"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : tone === "error" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CircleAlert className="h-4 w-4" />
        )}
      </div>

      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p
          className={cn(
            "leading-6 text-muted-foreground",
            tone === "error" && "text-destructive/80",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
