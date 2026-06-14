import { Outlet } from "react-router-dom"

import { SidebarNav } from "@/components/shell/sidebar-nav"
export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[15.75rem_minmax(0,1fr)]">
        <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border border-b backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
          <SidebarNav />
        </aside>
        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
