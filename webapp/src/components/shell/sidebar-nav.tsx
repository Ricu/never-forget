import { NavLink } from "react-router-dom"

import { navigationItems } from "@/components/shell/navigation"

export function SidebarNav() {
  return (
    <div className="flex h-full flex-col gap-8">
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.24em] text-stone-300">
          Never Forget
        </div>
        <div className="space-y-2">
          <h1 className="font-['Fraunces',_Georgia,_serif] text-3xl leading-tight text-stone-50">
            Calm capture, explicit review.
          </h1>
          <p className="max-w-xs text-sm leading-6 text-stone-400">
            This shell stays intentionally thin: real routes, no fake domain
            data, and a small connectivity proof to the backend.
          </p>
        </div>
      </div>

      <nav className="space-y-3" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "group block rounded-[1.4rem] border px-4 py-4 transition",
                isActive
                  ? "border-amber-300/50 bg-amber-200/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-white/8 bg-white/[0.04] text-stone-300 hover:border-white/20 hover:bg-white/[0.08]",
              ].join(" ")
            }
          >
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-stone-400 group-hover:text-stone-300">
              {item.eyebrow}
            </p>
            <p className="mt-2 text-lg font-medium">{item.label}</p>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-stone-400">
          Foundation
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-300">
          The next slices can now grow into capture, review, session, and memory
          behavior without replacing the shell boundary again.
        </p>
      </div>
    </div>
  )
}
