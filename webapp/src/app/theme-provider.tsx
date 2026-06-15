import { useEffect, useMemo, useState, type PropsWithChildren } from "react"

import {
  applyResolvedTheme,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  subscribeToSystemTheme,
  ThemeContext,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemeMode,
} from "@/app/theme-store"

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>(
    () => getStoredTheme() ?? "system",
  )
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  )

  useEffect(() => {
    return subscribeToSystemTheme(setSystemTheme)
  }, [])

  const resolvedTheme = resolveTheme(theme, systemTheme)

  useEffect(() => {
    applyResolvedTheme(resolvedTheme)
    window.localStorage.setItem("never-forget-theme", theme)
  }, [theme, resolvedTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      setTheme,
      theme,
    }),
    [resolvedTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
