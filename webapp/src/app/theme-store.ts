import { createContext } from "react"

export const THEME_STORAGE_KEY = "never-forget-theme"
const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)"

export type ThemeMode = "light" | "dark" | "system"
export type ResolvedTheme = Exclude<ThemeMode, "system">

export type ThemeContextValue = {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
}

const VALID_THEME_MODES: ThemeMode[] = ["light", "dark", "system"]

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function isThemeMode(
  value: string | null | undefined,
): value is ThemeMode {
  return value !== null && VALID_THEME_MODES.includes(value as ThemeMode)
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(storedTheme) ? storedTheme : null
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light"
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light"
}

export function resolveTheme(
  theme: ThemeMode,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return theme === "system" ? systemTheme : theme
}

export function applyResolvedTheme(resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return
  }

  const root = document.documentElement
  root.classList.toggle("dark", resolvedTheme === "dark")
  root.dataset.theme = resolvedTheme
  root.style.colorScheme = resolvedTheme
}

export function subscribeToSystemTheme(
  onChange: (theme: ResolvedTheme) => void,
) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {}
  }

  const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY)
  const handleChange = (event: MediaQueryListEvent) => {
    onChange(event.matches ? "dark" : "light")
  }

  mediaQuery.addEventListener("change", handleChange)

  return () => {
    mediaQuery.removeEventListener("change", handleChange)
  }
}
