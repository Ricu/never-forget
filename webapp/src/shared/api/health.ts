import { buildApiUrl } from "@/shared/api/client"

export type HealthStatus = {
  status: "ok"
  service: string
  environment: string
  version: string
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await fetch(buildApiUrl("/api/health"))

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`)
  }

  return (await response.json()) as HealthStatus
}
