export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"}${normalizedPath}`
}
