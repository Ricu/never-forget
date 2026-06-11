import type { LucideIcon } from "lucide-react"
import { AudioLines, BookOpenText, Inbox, Telescope } from "lucide-react"

export type NavigationItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  {
    to: "/capture",
    label: "Capture",
    icon: AudioLines,
  },
  {
    to: "/review-queue",
    label: "Review Queue",
    icon: Inbox,
  },
  {
    to: "/sessions",
    label: "Sessions",
    icon: Telescope,
  },
  {
    to: "/memory-overview",
    label: "Memory Overview",
    icon: BookOpenText,
  },
]
