import { Compass, Sparkle } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { CaptureComposerCard } from "@/features/capture/components/capture-composer-card"
import { buildNewCaptureSessionLocationState } from "@/features/sessions/lib/session-navigation"
import { Card, CardContent } from "@/shared/ui/card"

export function CapturePage() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <CaptureComposerCard
        onStartCapture={(text) => {
          navigate("/sessions/new", {
            state: buildNewCaptureSessionLocationState(text),
          })
        }}
      />

      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="grid gap-4 px-6 py-5 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full border border-sky-300/20 bg-sky-300/10 p-2 text-sky-200">
              <Compass className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">One fresh prompt</p>
              <p className="text-sm leading-6 text-muted-foreground">
                This slice only supports the first direct-text capture
                submission.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full border border-sky-300/20 bg-sky-300/10 p-2 text-sky-200">
              <Sparkle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Session thread first</p>
              <p className="text-sm leading-6 text-muted-foreground">
                The session view will show the live assistant response and any
                tool activity inline.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full border border-orange-300/20 bg-orange-300/10 p-2 text-orange-200">
              <Sparkle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">No continuation yet</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Reopening uses persisted session data. Continuing an existing
                session is a later slice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
