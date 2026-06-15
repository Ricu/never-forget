import { useNavigate } from "react-router-dom"

import { CaptureComposerCard } from "@/features/capture/components/capture-composer-card"
import { buildNewCaptureSessionLocationState } from "@/features/sessions/lib/session-navigation"

export function CapturePage() {
  const navigate = useNavigate()

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-start justify-center pt-6 sm:pt-10 lg:pt-14">
      <CaptureComposerCard
        onStartCapture={(text) => {
          navigate("/sessions/new", {
            state: buildNewCaptureSessionLocationState(text),
          })
        }}
      />
    </section>
  )
}
