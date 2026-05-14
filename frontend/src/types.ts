export interface PersonSummary {
  id: string;
  name: string;
  aliases: string[];
}

export interface LinkedEntityRef {
  type: string;
  id: string;
}

export interface MemoryRecord {
  id: string;
  capture_session_id: string;
  type: string;
  title: string | null;
  text: string;
  linked_entities: LinkedEntityRef[];
  linkedPersons: PersonSummary[];
  timeline_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaptureSessionRecord {
  id: string;
  audio_ref: string | null;
  transcript: string;
  transcript_segments: Array<Record<string, unknown>> | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  audioUrl: string | null;
  memories: MemoryRecord[];
}

export interface PersonRecord {
  id: string;
  name: string;
  aliases: string[];
  created_at: string;
  updated_at: string;
  memories?: MemoryRecord[];
}

export interface CaptureRunMessage {
  id: string;
  text: string;
}

export interface RunEventItem {
  id: string;
  kind: "assistant" | "tool" | "system" | "error";
  title: string;
  detail?: string;
  tone?: "neutral" | "success" | "error";
}

export type RunStageKey =
  | "capture"
  | "transcription"
  | "extraction"
  | "persistence"
  | "complete";

export type RunStageStatus = "pending" | "active" | "done" | "error" | "skipped";

export interface CaptureRunState {
  status: "idle" | "running" | "finished" | "error";
  messages: CaptureRunMessage[];
  transcript: string | null;
  artifacts: MemoryRecord[];
  createdPersonIds: string[];
  createdPersons: PersonSummary[];
  events: RunEventItem[];
  stages: Record<RunStageKey, RunStageStatus>;
  error: string | null;
}
