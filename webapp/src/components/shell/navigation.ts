export type NavigationItem = {
  to: string
  label: string
  eyebrow: string
}

export const navigationItems: NavigationItem[] = [
  {
    to: "/capture",
    label: "Capture",
    eyebrow: "Input now",
  },
  {
    to: "/review-queue",
    label: "Review Queue",
    eyebrow: "Needs attention",
  },
  {
    to: "/sessions",
    label: "Sessions",
    eyebrow: "Source history",
  },
  {
    to: "/memory-overview",
    label: "Memory Overview",
    eyebrow: "Browse output",
  },
]
