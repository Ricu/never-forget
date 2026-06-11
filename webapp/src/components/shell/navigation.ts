export type NavigationItem = {
  to: string
  label: string
  glyph: string
}

export const navigationItems: NavigationItem[] = [
  {
    to: "/capture",
    label: "Capture",
    glyph: "C",
  },
  {
    to: "/review-queue",
    label: "Review Queue",
    glyph: "R",
  },
  {
    to: "/sessions",
    label: "Sessions",
    glyph: "S",
  },
  {
    to: "/memory-overview",
    label: "Memory Overview",
    glyph: "M",
  },
]
