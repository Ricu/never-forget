import { Outlet } from "react-router-dom"

import { SidebarNav } from "@/components/shell/sidebar-nav"

export function AppShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_76%_-18%,rgba(0,153,255,0.12),transparent_31%),radial-gradient(circle_at_18%_112%,rgba(255,122,61,0.08),transparent_28%),var(--app-canvas)] text-[var(--app-ink)]">
      <div className="grid min-h-screen lg:grid-cols-[15.75rem_minmax(0,1fr)]">
        <aside className="border-b border-[var(--app-hairline-soft)] bg-[rgba(9,9,9,0.88)] backdrop-blur-[20px] lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
          <SidebarNav />
        </aside>
        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
