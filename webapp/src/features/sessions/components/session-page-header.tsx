import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/shared/ui/button"

type SessionPageHeaderProps = {
  sessionId?: string | null
}

export function SessionPageHeader({ sessionId }: SessionPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link to="/capture">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to capture</span>
          </Link>
        </Button>

        {sessionId ? (
          <p className="font-mono text-xs text-muted-foreground">
            {sessionId.slice(0, 8)}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Capture session
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Review the first agent pass for this capture.
        </p>
      </div>
    </header>
  )
}
