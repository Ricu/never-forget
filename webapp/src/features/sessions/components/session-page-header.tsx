import { ArrowLeft, FileText, Hash } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/shared/ui/button"

type SessionPageHeaderProps = {
  sessionId?: string | null
}

export function SessionPageHeader({ sessionId }: SessionPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link to="/capture">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to capture</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs tracking-[0.16em] text-muted-foreground uppercase">
          <FileText className="h-3.5 w-3.5" />
          <span>Direct text capture</span>
          {sessionId ? (
            <>
              <span className="text-white/20">/</span>
              <Hash className="h-3 w-3" />
              <span className="font-mono normal-case tracking-normal text-foreground">
                {sessionId.slice(0, 8)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-[clamp(28px,4vw,42px)] font-semibold leading-[1.04] tracking-[-0.03em]">
          Capture Session
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Inspect the first agent pass for this capture. The thread is the
          session.
        </p>
      </div>
    </header>
  )
}
