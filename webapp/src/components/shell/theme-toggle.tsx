import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme, type ThemeMode } from "@/app/theme"
import { Button } from "@/shared/ui/button"
import { ButtonGroup } from "@/shared/ui/button-group"

const THEME_OPTIONS: Array<{
  icon: typeof Sun
  label: string
  value: ThemeMode
}> = [
  {
    icon: Sun,
    label: "Light",
    value: "light",
  },
  {
    icon: Monitor,
    label: "System",
    value: "system",
  },
  {
    icon: Moon,
    label: "Dark",
    value: "dark",
  },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mt-auto border-t border-sidebar-border px-2 py-3">
      <div className="flex items-center justify-between gap-3 px-2 pb-2">
        <span className="text-xs text-muted-foreground">Theme</span>
      </div>

      <ButtonGroup aria-label="Theme" className="w-full">
        {THEME_OPTIONS.map(({ icon: Icon, label, value }) => (
          <Button
            aria-label={label}
            aria-pressed={theme === value}
            className="flex-1"
            key={value}
            onClick={() => {
              setTheme(value)
            }}
            size="icon-sm"
            title={label}
            variant={theme === value ? "secondary" : "ghost"}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
