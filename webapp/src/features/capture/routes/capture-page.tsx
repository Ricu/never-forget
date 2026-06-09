import { RoutePlaceholder } from "@/features/shared/route-placeholder"

export function CapturePage() {
  return (
    <RoutePlaceholder
      title="Capture is the first-class intake surface."
      summary="This route is reserved for fast text, upload, and recording flows. The foundation keeps the route and layout stable without pretending that capture behavior already exists."
      boundary="No prompt input, upload control, recording widget, or fake review preview ships in this slice."
      nextSlice="Add the real capture interface and decide whether new submissions stay in-place or jump directly into an active run view."
    />
  )
}
