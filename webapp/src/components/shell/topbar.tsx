import { useQuery } from "@tanstack/react-query"

import type { NavigationItem } from "@/components/shell/navigation"
import { getHealthStatus } from "@/shared/api/health"

type TopbarProps = {
  activeItem: NavigationItem
}

export function Topbar({ activeItem }: TopbarProps) {
  const healthQuery = useQuery({
    queryKey: ["backend-health"],
    queryFn: getHealthStatus,
    refetchInterval: 30_000,
  })

  const healthBadge = healthQuery.data
    ? {
        label: "Backend reachable",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900",
        detail: `${healthQuery.data.service} · ${healthQuery.data.environment}`,
      }
    : healthQuery.isError
      ? {
          label: "Backend unavailable",
          tone: "border-rose-500/25 bg-rose-500/10 text-rose-900",
          detail: "Check the backend process on port 8000.",
        }
      : {
          label: "Checking backend",
          tone: "border-stone-900/10 bg-stone-900/5 text-stone-700",
          detail: "Polling /api/health",
        }

  return (
    <header className="rounded-[2rem] border border-stone-900/10 bg-white/70 px-5 py-5 shadow-[0_16px_48px_rgba(72,48,22,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-stone-500">
            {activeItem.eyebrow}
          </p>
          <div>
            <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl text-stone-950">
              {activeItem.label}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
              The shell is live, the routes are real, and the backend health
              check is the only server-state behavior intentionally pulled into
              this slice.
            </p>
          </div>
        </div>

        <div
          className={`rounded-full border px-4 py-3 text-sm ${healthBadge.tone}`}
        >
          <p className="font-medium">{healthBadge.label}</p>
          <p className="text-xs uppercase tracking-[0.18em] opacity-75">
            {healthBadge.detail}
          </p>
        </div>
      </div>
    </header>
  )
}
