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
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-red-400/20 bg-red-500/10 text-red-50"
          : "border-white/10 bg-white/[0.04] text-foreground",
      )}
    >
      <div
        className={cn(
          "mt-0.5 rounded-full p-1.5",
          tone === "error" ? "bg-red-500/20" : "bg-sky-400/12",
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
            "leading-6",
            tone === "error" ? "text-red-100/80" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
