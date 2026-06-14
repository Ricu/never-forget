import { Brain } from "lucide-react"
import { NavLink } from "react-router-dom"

import { navigationItems } from "@/components/shell/navigation"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button-variants"
import { Separator } from "@/shared/ui/separator"

export function SidebarNav() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-4 text-sm font-semibold lg:py-5">
        <span className="bg-card text-card-foreground inline-grid h-7 w-7 place-items-center rounded-lg border shadow-sm">
          <Brain className="h-4 w-4" />
        </span>
        <span>Never Forget</span>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="grid gap-1 px-2 py-3" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              buttonVariants({
                variant: "ghost",
                size: "sm",
                className: cn(
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                ),
              })
            }
          >
            <span className="border-border text-muted-foreground inline-grid h-[18px] w-[18px] place-items-center rounded-md border">
              <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
