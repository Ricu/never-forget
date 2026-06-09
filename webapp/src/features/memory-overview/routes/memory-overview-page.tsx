import { RoutePlaceholder } from "@/features/shared/route-placeholder"

export function MemoryOverviewPage() {
  return (
    <RoutePlaceholder
      title="Memory Overview is reserved for the read side."
      summary="The foundation draws a clear line between captured input and the memory surfaces that will eventually emerge from it."
      boundary="There are no mock cards, fake memory types, or fabricated browse data in this issue."
      nextSlice="Introduce the real memory overview only after persisted memories and their read models exist in the backend."
    />
  )
}
