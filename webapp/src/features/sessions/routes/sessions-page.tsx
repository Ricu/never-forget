import { RoutePlaceholder } from "@/features/shared/route-placeholder"

export function SessionsPage() {
  return (
    <RoutePlaceholder
      title="Sessions will expose provenance and history."
      summary="This page marks the separate home for capture-session history, distinct from both the review queue and the memory overview."
      boundary="No archive list, filters, transcript previews, or session detail wiring is pulled forward yet."
      nextSlice="Add read-side session browsing once real capture sessions exist and the backend has a query surface for them."
    />
  )
}
