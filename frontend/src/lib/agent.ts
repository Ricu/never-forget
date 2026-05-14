import {
  type AgentSubscriber,
  HttpAgent,
} from "@ag-ui/client";

import type {
  CaptureRunState,
  MemoryRecord,
  PersonSummary,
  RunEventItem,
  RunStageKey,
  RunStageStatus,
} from "../types";

function addEvent(
  state: CaptureRunState,
  kind: RunEventItem["kind"],
  title: string,
  detail?: string,
  tone: RunEventItem["tone"] = "neutral",
): CaptureRunState {
  return {
    ...state,
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        kind,
        title,
        detail,
        tone,
      },
    ],
  };
}

function setStage(
  state: CaptureRunState,
  stage: RunStageKey,
  status: RunStageStatus,
): CaptureRunState {
  return {
    ...state,
    stages: {
      ...state.stages,
      [stage]: status,
    },
  };
}

function normalizeMemories(memories: MemoryRecord[] | undefined): MemoryRecord[] {
  return (memories ?? []).map((memory) => ({
    ...memory,
    linkedPersons: memory.linkedPersons ?? [],
  }));
}

function formatToolArgs(args: Record<string, unknown>) {
  if (Object.keys(args).length === 0) return undefined;
  return JSON.stringify(args);
}

function formatToolResult(content: string) {
  return content.trim() || undefined;
}

export async function runCaptureSession(
  captureSessionId: string,
  onState: (updater: (state: CaptureRunState) => CaptureRunState) => void,
  onFinished: () => void,
) {
  const toolNames = new Map<string, string>();

  const agent = new HttpAgent({
    url: `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/ag-ui/capture-runs`,
    threadId: captureSessionId,
    initialState: { captureSessionId },
    initialMessages: [],
  });

  const subscriber: AgentSubscriber = {
    onRunStartedEvent() {
      onState((state) => ({
        ...setStage(state, "capture", "done"),
        status: "running",
      }));
      onState((state) => addEvent(state, "system", "Run started"));
    },
    onTextMessageStartEvent({ event }) {
      onState((state) => ({
        ...state,
        messages: [...state.messages, { id: event.messageId, text: "" }],
      }));
    },
    onTextMessageContentEvent({ event }) {
      onState((state) => ({
        ...state,
        messages: state.messages.map((message) =>
          message.id === event.messageId
            ? { ...message, text: message.text + event.delta }
            : message,
        ),
      }));
    },
    onTextMessageEndEvent({ event, textMessageBuffer }) {
      onState((state) =>
        addEvent(state, "assistant", "Assistant", textMessageBuffer),
      );
      onState((state) => ({
        ...state,
        messages: state.messages.filter((message) => message.id !== event.messageId),
      }));
    },
    onStepStartedEvent({ event }) {
      if (event.stepName === "transcription") {
        onState((state) => setStage(state, "transcription", "active"));
      }
      if (event.stepName === "extraction") {
        onState((state) => setStage(state, "extraction", "active"));
        onState((state) => setStage(state, "persistence", "active"));
      }
    },
    onStepFinishedEvent({ event }) {
      if (event.stepName === "transcription") {
        onState((state) => setStage(state, "transcription", "done"));
      }
      if (event.stepName === "extraction") {
        onState((state) => setStage(state, "extraction", "done"));
      }
    },
    onCustomEvent({ event }) {
      if (event.name === "capture_session_ready") {
        onState((state) => addEvent(state, "system", "Capture session ready"));
      }
      if (event.name === "transcription_started") {
        onState((state) => addEvent(setStage(state, "transcription", "active"), "system", "Transcription started"));
      }
      if (event.name === "transcription_completed") {
        onState((state) =>
          addEvent(
            {
              ...setStage(state, "transcription", "done"),
              transcript: String((event.value as { transcript?: string }).transcript ?? ""),
            },
            "system",
            "Transcript ready",
            "success",
          ),
        );
      }
      if (event.name === "artifacts_persisted") {
        const payload = event.value as {
          memories?: MemoryRecord[];
          createdPersonIds?: string[];
          createdPersons?: PersonSummary[];
        };
        const memoryCount = payload.memories?.length ?? 0;
        const personNames = (payload.createdPersons ?? []).map((person) => person.name);
        onState((state) =>
          addEvent(
            {
              ...setStage(setStage(state, "persistence", "done"), "extraction", "done"),
              artifacts: normalizeMemories(payload.memories),
              createdPersonIds: payload.createdPersonIds ?? [],
              createdPersons: payload.createdPersons ?? [],
            },
            "tool",
            "persist_artifacts",
            personNames.length > 0
              ? `${memoryCount} memories saved, contacts: ${personNames.join(", ")}`
              : `${memoryCount} memories saved`,
            "success",
          ),
        );
      }
    },
    onToolCallStartEvent({ event }) {
      toolNames.set(event.toolCallId, event.toolCallName);
    },
    onToolCallEndEvent({ event, toolCallName, toolCallArgs }) {
      onState((state) =>
        addEvent(
          state,
          "tool",
          `${toolCallName} args`,
          formatToolArgs(toolCallArgs),
        ),
      );
      toolNames.set(event.toolCallId, toolCallName);
    },
    onToolCallResultEvent({ event }) {
      const toolName = toolNames.get(event.toolCallId) ?? "tool_result";
      onState((state) =>
        addEvent(
          state,
          "tool",
          `${toolName} result`,
          formatToolResult(event.content),
          "success",
        ),
      );
    },
    onRunFinishedEvent() {
      onState((state) =>
        addEvent(
          {
            ...setStage(state, "complete", "done"),
            status: "finished",
          },
          "system",
          "Run finished",
          "success",
        ),
      );
      onFinished();
    },
    onRunErrorEvent({ event }) {
      onState((state) =>
        addEvent(
          {
            ...state,
            status: "error",
            error: event.message,
            stages: Object.fromEntries(
              Object.entries(state.stages).map(([key, value]) => [
                key,
                value === "active" ? "error" : value,
              ]),
            ) as CaptureRunState["stages"],
          },
          "error",
          "Run failed",
          event.message,
          "error",
        ),
      );
    },
  };

  try {
    await agent.runAgent(
      {
        runId: crypto.randomUUID(),
      },
      subscriber,
    );
  } catch (error) {
    onState((state) =>
      addEvent(
        {
          ...state,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown run error",
        },
        "error",
        "Run failed",
        error instanceof Error ? error.message : "Unknown run error",
        "error",
      ),
    );
  }
}
