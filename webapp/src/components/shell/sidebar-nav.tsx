import { NavLink } from "react-router-dom"

import { navigationItems } from "@/components/shell/navigation"

export function SidebarNav() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-4 text-sm font-semibold text-[var(--app-ink)] lg:px-4 lg:py-[18px]">
        <span className="h-[25px] w-[25px] rounded-[8px] border border-[var(--app-hairline)] bg-[linear-gradient(135deg,rgba(0,153,255,0.78),transparent_49%),linear-gradient(315deg,rgba(255,122,61,0.72),transparent_47%),var(--app-surface-1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
        <span>Never Forget</span>
      </div>

      <nav
        className="grid gap-[3px] px-[10px] pb-4 lg:pt-1"
        aria-label="Primary navigation"
      >
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex min-h-10 items-center gap-[10px] rounded-lg px-[10px] text-[13px] transition-colors",
                isActive
                  ? "bg-[var(--app-surface-1)] text-[var(--app-ink)]"
                  : "text-[var(--app-ink-muted)] hover:bg-[rgba(255,255,255,0.045)] hover:text-[var(--app-ink)]",
              ].join(" ")
            }
          >
            <span className="inline-grid h-[18px] w-[18px] place-items-center rounded-md border border-[var(--app-hairline)] text-[11px] text-[var(--app-ink-muted)]">
              {item.glyph}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
