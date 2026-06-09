import { Outlet, useLocation } from "react-router-dom"

import { navigationItems } from "@/components/shell/navigation"
import { SidebarNav } from "@/components/shell/sidebar-nav"
import { Topbar } from "@/components/shell/topbar"

export function AppShell() {
  const location = useLocation()
  const activeItem =
    navigationItems.find((item) => location.pathname.startsWith(item.to)) ??
    navigationItems[0]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(218,130,74,0.28),_transparent_25%),linear-gradient(180deg,_#f6efdf_0%,_#f3ecdd_55%,_#efe5d5_100%)] px-4 py-4 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-stone-900/10 bg-stone-950 px-5 py-6 text-stone-100 shadow-[0_24px_80px_rgba(40,24,8,0.22)]">
          <SidebarNav />
        </aside>
        <div className="flex min-h-full flex-col gap-4">
          <Topbar activeItem={activeItem} />
          <main className="flex-1 rounded-[2rem] border border-stone-900/10 bg-white/85 p-5 shadow-[0_24px_80px_rgba(78,50,24,0.12)] backdrop-blur sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
