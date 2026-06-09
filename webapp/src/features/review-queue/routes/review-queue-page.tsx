import { RoutePlaceholder } from "@/features/shared/route-placeholder"

export function ReviewQueuePage() {
  return (
    <RoutePlaceholder
      title="Review Queue will become the inbox for unresolved sessions."
      summary="The route exists so the app architecture already reflects the review loop: capture now, inspect later, and keep that work separate from the memory library."
      boundary="There is no fake queue list, no mock statuses, and no pretend transcript rows in this foundation pass."
      nextSlice="Introduce real session summaries, attention states, and routing from queue rows into the eventual review session detail surface."
    />
  )
}
