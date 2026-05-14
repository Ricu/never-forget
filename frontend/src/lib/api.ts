import type {
  CaptureSessionRecord,
  MemoryRecord,
  PersonRecord,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  createTextCapture(text: string) {
    return request<CaptureSessionRecord>("/api/captures", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  createAudioCapture(file: File, source: string) {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("source", source);
    return request<CaptureSessionRecord>("/api/captures", {
      method: "POST",
      body: formData,
    });
  },
  listMemories(query = "", type = "") {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<MemoryRecord[]>(`/api/memories${suffix}`);
  },
  getMemory(memoryId: string) {
    return request<MemoryRecord>(`/api/memories/${memoryId}`);
  },
  updateMemory(memoryId: string, payload: Partial<MemoryRecord> & { person_ids?: string[] }) {
    return request<MemoryRecord>(`/api/memories/${memoryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteMemory(memoryId: string) {
    return request<void>(`/api/memories/${memoryId}`, {
      method: "DELETE",
    });
  },
  listSessions() {
    return request<CaptureSessionRecord[]>("/api/capture-sessions");
  },
  getSession(sessionId: string) {
    return request<CaptureSessionRecord>(`/api/capture-sessions/${sessionId}`);
  },
  updateSession(sessionId: string, transcript: string) {
    return request<CaptureSessionRecord>(`/api/capture-sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ transcript }),
    });
  },
  deleteSession(sessionId: string) {
    return request<void>(`/api/capture-sessions/${sessionId}`, {
      method: "DELETE",
    });
  },
  listContacts(query = "") {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return request<PersonRecord[]>(`/api/persons${suffix}`);
  },
  getContact(personId: string) {
    return request<PersonRecord>(`/api/persons/${personId}`);
  },
  createContact(payload: { name: string; aliases: string[] }) {
    return request<PersonRecord>("/api/persons", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateContact(personId: string, payload: { name?: string; aliases?: string[] }) {
    return request<PersonRecord>(`/api/persons/${personId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
