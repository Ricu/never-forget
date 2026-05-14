import { Component, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Navigate, Route, Routes, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookText, FileAudio, Mic, Pencil, Radio, Users } from "lucide-react";

import { api } from "./lib/api";
import { runCaptureSession } from "./lib/agent";
import { formatDate, cn } from "./lib/utils";
import { Badge, Button, Card, Input, SecondaryButton, Textarea } from "./components/ui";
import type { CaptureRunState, CaptureSessionRecord, MemoryRecord, RunStageKey, RunStageStatus } from "./types";

const memoryTypes = ["moment", "friend_note", "idea", "todo", "symptom", "miscellaneous"];
const navigationItems = [
  { to: "/capture", label: "Capture", icon: Radio },
  { to: "/memories", label: "Memories", icon: BookText },
  { to: "/sessions", label: "Sessions", icon: FileAudio },
  { to: "/contacts", label: "Contacts", icon: Users },
];

const memorySchema = z.object({
  type: z.string().min(1),
  title: z.string().nullable().optional(),
  text: z.string().min(1),
  timeline_at: z.string().nullable().optional(),
  person_ids: z.array(z.string()),
});

const sessionSchema = z.object({
  transcript: z.string().min(1),
});

const contactSchema = z.object({
  name: z.string().min(1),
  aliases: z.string(),
});

function createInitialRunState(hasAudio = false): CaptureRunState {
  return {
    status: "idle",
    messages: [],
    transcript: null,
    artifacts: [],
    createdPersonIds: [],
    createdPersons: [],
    events: [],
    stages: {
      capture: "pending",
      transcription: hasAudio ? "pending" : "skipped",
      extraction: "pending",
      persistence: "pending",
      complete: "pending",
    },
    error: null,
  };
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6">
          <Card className="w-full space-y-4 text-center">
            <SectionTitle
              title="Frontend Error"
              subtitle="The UI hit a runtime error. Reload the page to recover."
            />
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()}>Reload page</Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f6eee1,transparent_35%),linear-gradient(180deg,#fdfaf4_0%,#f4eee6_100%)] text-stone-900">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-stone-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Never Forget</p>
                <h1 className="font-serif text-4xl text-stone-950">Stage 1 Capture Console</h1>
              </div>
              <p className="max-w-2xl text-sm text-stone-600">
                Capture, stream, inspect, edit, and delete memories, sessions, and contacts from one local-first workspace.
              </p>
            </div>
            <nav className="flex flex-wrap gap-3">
              {navigationItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "border-stone-300 bg-white text-stone-950 shadow-sm"
                        : "border-transparent bg-stone-100/80 text-stone-600 hover:border-stone-200 hover:bg-white hover:text-stone-900",
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="grid flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/capture" replace />} />
              <Route path="/capture" element={<CapturePage />} />
              <Route path="/memories" element={<MemoriesPage />} />
              <Route path="/memories/:memoryId" element={<MemoryDetailPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/contacts/:contactId" element={<ContactDetailPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppErrorBoundary>
  );
}

function CapturePage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"text" | "upload" | "record">("text");
  const [text, setText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [latestSession, setLatestSession] = useState<CaptureSessionRecord | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [runState, setRunState] = useState<CaptureRunState>(createInitialRunState());

  const resetRunState = (hasAudio = false) =>
    setRunState(createInitialRunState(hasAudio));

  async function startRun(session: CaptureSessionRecord) {
    setLatestSession(session);
    resetRunState(Boolean(session.audio_ref));
    await runCaptureSession(
      session.id,
      (updater) => setRunState((state) => updater(state)),
      () => {
        queryClient.invalidateQueries({ queryKey: ["memories"] });
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      },
    );
    const refreshed = await api.getSession(session.id);
    setLatestSession(refreshed);
  }

  const textMutation = useMutation({
    mutationFn: async () => {
      const session = await api.createTextCapture(text);
      await startRun(session);
      setText("");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error("Choose an audio file first");
      const session = await api.createAudioCapture(uploadFile, "audio_upload");
      await startRun(session);
      setUploadFile(null);
    },
  });

  const recordingMutation = useMutation({
    mutationFn: async () => {
      if (!recordedFile) throw new Error("Record audio first");
      const session = await api.createAudioCapture(recordedFile, "voice_recording");
      await startRun(session);
      setRecordedFile(null);
    },
  });

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const suffix = blob.type.includes("wav") ? "wav" : "webm";
      setRecordedFile(new File([blob], `recording.${suffix}`, { type: blob.type }));
      stream.getTracks().forEach((track) => track.stop());
    };
    mediaRecorder.start();
    setRecorder(mediaRecorder);
  }

  function stopRecording() {
    recorder?.stop();
    setRecorder(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="space-y-5">
        <SectionTitle title="Create Capture" subtitle="Submit text, a single uploaded file, or a browser recording." />
        <div className="flex flex-wrap gap-2">
          <ModeButton active={mode === "text"} onClick={() => setMode("text")} icon={<Pencil className="size-4" />} label="Text" />
          <ModeButton active={mode === "upload"} onClick={() => setMode("upload")} icon={<FileAudio className="size-4" />} label="Upload" />
          <ModeButton active={mode === "record"} onClick={() => setMode("record")} icon={<Mic className="size-4" />} label="Record" />
        </div>

        {mode === "text" && (
          <div className="space-y-3">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type a diary thought, note, reminder, or observation."
            />
            <Button disabled={textMutation.isPending || !text.trim()} onClick={() => textMutation.mutate()}>
              {textMutation.isPending ? "Submitting..." : "Start Pipeline"}
            </Button>
            {textMutation.error && <InlineError message={textMutation.error.message} />}
          </div>
        )}

        {mode === "upload" && (
          <div className="space-y-3">
            <Input type="file" accept="audio/*" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} />
            {uploadFile && <Badge>{uploadFile.name}</Badge>}
            <Button disabled={uploadMutation.isPending || !uploadFile} onClick={() => uploadMutation.mutate()}>
              {uploadMutation.isPending ? "Uploading..." : "Upload And Process"}
            </Button>
            {uploadMutation.error && <InlineError message={uploadMutation.error.message} />}
          </div>
        )}

        {mode === "record" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button disabled={Boolean(recorder)} onClick={() => void startRecording()}>
                Start Recording
              </Button>
              <SecondaryButton disabled={!recorder} onClick={stopRecording}>
                Stop Recording
              </SecondaryButton>
            </div>
            {recordedFile && <Badge>{recordedFile.name}</Badge>}
            <Button disabled={recordingMutation.isPending || !recordedFile} onClick={() => recordingMutation.mutate()}>
              {recordingMutation.isPending ? "Processing..." : "Process Recording"}
            </Button>
            {recordingMutation.error && <InlineError message={recordingMutation.error.message} />}
          </div>
        )}
      </Card>

      <Card className="space-y-5">
        <SectionTitle title="Active Run" subtitle="AG-UI-backed stream for the latest capture run." />
        {latestSession ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-3 rounded-[1.75rem] border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{latestSession.id}</Badge>
                  <Badge>{String(latestSession.metadata.source ?? "unknown")}</Badge>
                  <Badge className={runStatusTone(runState.status)}>{runState.status}</Badge>
                </div>
                <p className="text-sm text-stone-600">
                  {runState.status === "idle" && "Waiting for a new capture."}
                  {runState.status === "running" && "Pipeline is active. The stages below update as work completes."}
                  {runState.status === "finished" &&
                    `Finished with ${runState.artifacts.length} memories and ${runState.createdPersonIds.length} contacts.`}
                  {runState.status === "error" && "The run failed. Inspect the error and event log below."}
                </p>
                {runState.createdPersons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {runState.createdPersons.map((person) => (
                      <Link key={person.id} to={`/contacts/${person.id}`}>
                        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">{person.name}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-start">
                <Link className="text-sm font-medium text-stone-700 underline" to={`/sessions/${latestSession.id}`}>
                  Open session
                </Link>
              </div>
            </div>

            <RunStages stages={runState.stages} hasAudio={Boolean(latestSession.audio_ref)} />

            <ExpandablePanel
              title="Transcript"
              subtitle={
                runState.transcript || latestSession.transcript
                  ? "Available"
                  : "Pending"
              }
              defaultOpen
            >
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                {runState.transcript || latestSession.transcript || "Transcript appears after ASR completes."}
              </div>
            </ExpandablePanel>

            <ExpandablePanel
              title="Activity"
              subtitle={`${runState.events.length} entries`}
              defaultOpen
            >
              <div className="space-y-2">
                {runState.events.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                    No stream activity yet.
                  </div>
                ) : (
                  runState.events.map((eventItem) => (
                    <div
                      key={eventItem.id}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm",
                        eventTone(eventItem.tone),
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={kindTone(eventItem.kind)}>{eventItem.kind}</Badge>
                        <span className="font-medium">{eventItem.title}</span>
                      </div>
                      {eventItem.detail && <p className="mt-2 text-sm">{eventItem.detail}</p>}
                    </div>
                  ))
                )}
              </div>
            </ExpandablePanel>

            <ExpandablePanel
              title="Persisted artifacts"
              subtitle={`${runState.artifacts.length} items`}
              defaultOpen
            >
              <div className="grid gap-3">
                {runState.artifacts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                    No artifacts persisted yet.
                  </div>
                ) : (
                  runState.artifacts.map((artifact) => <MemoryCard key={artifact.id} memory={artifact} />)
                )}
              </div>
            </ExpandablePanel>

            {runState.error && <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{runState.error}</p>}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 p-5 text-sm text-stone-500">
            Start a capture to open the run panel.
          </div>
        )}
      </Card>
    </div>
  );
}

function MemoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const selectedType = searchParams.get("type") ?? "";
  const memoriesQuery = useQuery({
    queryKey: ["memories", query, selectedType],
    queryFn: () => api.listMemories(query, selectedType),
  });

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <SectionTitle title="Memories" subtitle="Search, filter, inspect, edit, and delete persisted memories." />
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={query}
            onChange={(event) => setSearchParams((params) => setParam(params, "q", event.target.value))}
            placeholder="Search titles and text"
          />
          <select
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
            value={selectedType}
            onChange={(event) => setSearchParams((params) => setParam(params, "type", event.target.value))}
          >
            <option value="">All types</option>
            {memoryTypes.map((memoryType) => (
              <option key={memoryType} value={memoryType}>
                {memoryType}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-3">
        {memoriesQuery.data?.map((memory) => <MemoryCard key={memory.id} memory={memory} showLinks />)}
      </div>
    </div>
  );
}

function MemoryDetailPage() {
  const { memoryId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const memoryQuery = useQuery({
    queryKey: ["memory", memoryId],
    queryFn: () => api.getMemory(memoryId),
  });
  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.listContacts(),
  });

  const form = useForm<z.infer<typeof memorySchema>>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      type: "moment",
      title: "",
      text: "",
      timeline_at: "",
      person_ids: [],
    },
  });

  useEffect(() => {
    if (!memoryQuery.data) return;
    form.reset({
      type: memoryQuery.data.type,
      title: memoryQuery.data.title ?? "",
      text: memoryQuery.data.text,
      timeline_at: memoryQuery.data.timeline_at ?? "",
      person_ids: memoryQuery.data.linkedPersons.map((person) => person.id),
    });
  }, [form, memoryQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof memorySchema>) =>
      api.updateMemory(memoryId, {
        ...values,
        timeline_at: values.timeline_at || null,
        title: values.title || null,
        person_ids: values.person_ids,
      }),
    onSuccess: (memory) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      queryClient.setQueryData(["memory", memoryId], memory);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteMemory(memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      navigate("/memories");
    },
  });

  if (!memoryQuery.data) {
    return <LoadingCard label="Loading memory..." />;
  }

  return (
    <Card className="space-y-6">
      <SectionTitle title="Memory Detail" subtitle={`Created ${formatDate(memoryQuery.data.created_at)}`} />
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            Type
            <select className="rounded-xl border border-stone-300 px-3 py-2" {...form.register("type")}>
              {memoryTypes.map((memoryType) => (
                <option key={memoryType} value={memoryType}>
                  {memoryType}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Title
            <Input {...form.register("title")} />
          </label>
        </div>
        <label className="grid gap-2 text-sm">
          Text
          <Textarea {...form.register("text")} />
        </label>
        <label className="grid gap-2 text-sm">
          Timeline date
          <Input type="text" placeholder="Optional ISO date or datetime" {...form.register("timeline_at")} />
        </label>
        <div className="grid gap-2 text-sm">
          <span>Linked contacts</span>
          <div className="grid gap-2 md:grid-cols-2">
            {contactsQuery.data?.map((contact) => (
              <label key={contact.id} className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2">
                <input type="checkbox" value={contact.id} {...form.register("person_ids")} />
                <span>{contact.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            Save memory
          </Button>
          <SecondaryButton
            type="button"
            onClick={() => {
              if (window.confirm("Delete this memory permanently?")) deleteMutation.mutate();
            }}
          >
            Delete memory
          </SecondaryButton>
          <Link className="text-sm font-medium text-stone-700 underline" to={`/sessions/${memoryQuery.data.capture_session_id}`}>
            Open capture session
          </Link>
        </div>
      </form>
    </Card>
  );
}

function SessionsPage() {
  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.listSessions(),
  });

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Capture Sessions" subtitle="Browse sessions directly, including audio-backed captures." />
      </Card>
      <div className="grid gap-3">
        {sessionsQuery.data?.map((session) => (
          <Card key={session.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{String(session.metadata.source ?? "unknown")}</Badge>
              <Badge>{String(session.metadata.status ?? "pending")}</Badge>
              {session.audioUrl && <Badge>audio</Badge>}
            </div>
            <div>
              <p className="font-medium text-stone-950">{session.id}</p>
              <p className="text-sm text-stone-600">{session.transcript || "Transcript pending or empty."}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-stone-600">
              <span>Updated {formatDate(session.updated_at)}</span>
              <Link className="font-medium underline" to={`/sessions/${session.id}`}>
                Open session
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SessionDetailPage() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.getSession(sessionId),
  });

  const form = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { transcript: "" },
  });

  useEffect(() => {
    if (!sessionQuery.data) return;
    form.reset({ transcript: sessionQuery.data.transcript });
  }, [form, sessionQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof sessionSchema>) => api.updateSession(sessionId, values.transcript),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.setQueryData(["session", sessionId], session);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      navigate("/sessions");
    },
  });

  if (!sessionQuery.data) return <LoadingCard label="Loading session..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-5">
        <SectionTitle title="Capture Session" subtitle={`Created ${formatDate(sessionQuery.data.created_at)}`} />
        <div className="flex flex-wrap gap-2">
          <Badge>{String(sessionQuery.data.metadata.source ?? "unknown")}</Badge>
          <Badge>{String(sessionQuery.data.metadata.status ?? "pending")}</Badge>
          {Boolean(sessionQuery.data.metadata.error) ? (
            <Badge>{String(sessionQuery.data.metadata.error)}</Badge>
          ) : null}
        </div>
        {sessionQuery.data.audioUrl && <audio className="w-full" controls src={sessionQuery.data.audioUrl} />}
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
          <label className="grid gap-2 text-sm">
            Transcript
            <Textarea {...form.register("transcript")} className="min-h-48" />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save transcript</Button>
            <SecondaryButton
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this capture session, its managed audio file, and all derived memories?",
                  )
                ) {
                  deleteMutation.mutate();
                }
              }}
            >
              Delete session
            </SecondaryButton>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="Derived Memories" subtitle="Artifacts created together from this session." />
        <div className="grid gap-3">
          {sessionQuery.data.memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} showLinks />
          ))}
        </div>
      </Card>
    </div>
  );
}

function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const contactsQuery = useQuery({
    queryKey: ["contacts", search],
    queryFn: () => api.listContacts(search),
  });

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", aliases: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof contactSchema>) =>
      api.createContact({
        name: values.name,
        aliases: splitAliases(values.aliases),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      form.reset();
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Card className="space-y-4">
        <SectionTitle title="Contacts" subtitle="Manage persons extracted from memories or created manually." />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts" />
        <div className="grid gap-3">
          {contactsQuery.data?.map((contact) => (
            <Card key={contact.id} className="rounded-2xl border-stone-100 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-950">{contact.name}</p>
                  <p className="text-sm text-stone-500">{contact.aliases.join(", ") || "No aliases"}</p>
                </div>
                <Link className="text-sm font-medium underline" to={`/contacts/${contact.id}`}>
                  Open
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="Create Contact" subtitle="Manual contact creation is available in Stage 1." />
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
          <label className="grid gap-2 text-sm">
            Name
            <Input {...form.register("name")} />
          </label>
          <label className="grid gap-2 text-sm">
            Aliases
            <Input placeholder="Comma separated aliases" {...form.register("aliases")} />
          </label>
          <Button type="submit">Create contact</Button>
        </form>
      </Card>
    </div>
  );
}

function ContactDetailPage() {
  const { contactId = "" } = useParams();
  const queryClient = useQueryClient();
  const contactQuery = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => api.getContact(contactId),
  });

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", aliases: "" },
  });

  useEffect(() => {
    if (!contactQuery.data) return;
    form.reset({
      name: contactQuery.data.name,
      aliases: contactQuery.data.aliases.join(", "),
    });
  }, [contactQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: z.infer<typeof contactSchema>) =>
      api.updateContact(contactId, {
        name: values.name,
        aliases: splitAliases(values.aliases),
      }),
    onSuccess: (person) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.setQueryData(["contact", contactId], person);
    },
  });

  if (!contactQuery.data) return <LoadingCard label="Loading contact..." />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <Card className="space-y-4">
        <SectionTitle title="Contact Detail" subtitle={`Updated ${formatDate(contactQuery.data.updated_at)}`} />
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
          <label className="grid gap-2 text-sm">
            Name
            <Input {...form.register("name")} />
          </label>
          <label className="grid gap-2 text-sm">
            Aliases
            <Input {...form.register("aliases")} />
          </label>
          <Button type="submit">Save contact</Button>
        </form>
      </Card>
      <Card className="space-y-4">
        <SectionTitle title="Linked Memories" subtitle="Memories associated with this person." />
        <div className="grid gap-3">
          {(contactQuery.data.memories ?? []).map((memory) => (
            <MemoryCard key={memory.id} memory={memory} showLinks />
          ))}
        </div>
      </Card>
    </div>
  );
}

function MemoryCard({ memory, showLinks = false }: { memory: MemoryRecord; showLinks?: boolean }) {
  const linkedPersons = memory.linkedPersons ?? [];

  return (
    <Card className="space-y-3 rounded-[1.75rem]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={badgeTone(memory.type)}>{memory.type}</Badge>
        {memory.timeline_at && <Badge>{memory.timeline_at}</Badge>}
      </div>
      <div className="space-y-1">
        {memory.title && <p className="font-medium text-stone-950">{memory.title}</p>}
        <p className="text-sm leading-6 text-stone-700">{memory.text}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {linkedPersons.map((person) => (
          <Link key={person.id} to={`/contacts/${person.id}`}>
            <Badge>{person.name}</Badge>
          </Link>
        ))}
      </div>
      {showLinks && (
        <div className="flex flex-wrap gap-3 text-sm text-stone-600">
          <Link className="font-medium underline" to={`/memories/${memory.id}`}>
            Open memory
          </Link>
          <Link className="font-medium underline" to={`/sessions/${memory.capture_session_id}`}>
            Open session
          </Link>
        </div>
      )}
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-1">
      <h2 className="font-serif text-3xl text-stone-950">{title}</h2>
      <p className="text-sm text-stone-600">{subtitle}</p>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-stone-300 bg-white text-stone-950 shadow-sm"
          : "border-transparent bg-stone-100/80 text-stone-600 hover:border-stone-200 hover:bg-white hover:text-stone-900",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="text-sm text-stone-500">
      {label}
    </Card>
  );
}

function InlineError({ message }: { message: string }) {
  return <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{message}</p>;
}

function ExpandablePanel({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[1.5rem] border border-stone-200 bg-white/70 p-4"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-stone-600">{subtitle}</p>}
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 transition group-open:rotate-180">
          ^
        </span>
      </summary>
      <div className="mt-4 space-y-3">{children}</div>
    </details>
  );
}

function RunStages({
  stages,
  hasAudio,
}: {
  stages: Record<RunStageKey, RunStageStatus>;
  hasAudio: boolean;
}) {
  const items: Array<{ key: RunStageKey; label: string; subtitle: string }> = [
    { key: "capture", label: "Capture", subtitle: "" },
    {
      key: "transcription",
      label: "Transcription",
      subtitle: "",
    },
    { key: "extraction", label: "Extract", subtitle: "" },
    { key: "persistence", label: "Persist", subtitle: "" },
    { key: "complete", label: "Done", subtitle: "" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const status = item.key === "transcription" && !hasAudio ? "skipped" : stages[item.key];
        return (
          <div key={item.key} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm", stageTone(status))}>
            <span className="font-medium">{item.label}</span>
            <Badge className={cn("border-current bg-transparent capitalize", statusTextTone(status))}>{status}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function badgeTone(type: string) {
  if (type === "todo") return "border-amber-200 bg-amber-100 text-amber-800";
  if (type === "friend_note") return "border-sky-200 bg-sky-100 text-sky-800";
  if (type === "idea") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (type === "symptom") return "border-rose-200 bg-rose-100 text-rose-800";
  if (type === "moment") return "border-violet-200 bg-violet-100 text-violet-800";
  return "border-stone-200 bg-stone-100 text-stone-800";
}

function runStatusTone(status: CaptureRunState["status"]) {
  if (status === "finished") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (status === "error") return "border-rose-200 bg-rose-100 text-rose-800";
  if (status === "running") return "border-sky-200 bg-sky-100 text-sky-800";
  return "border-stone-200 bg-stone-100 text-stone-700";
}

function eventTone(tone: "neutral" | "success" | "error" = "neutral") {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-stone-200 bg-stone-50 text-stone-700";
}

function kindTone(kind: "assistant" | "tool" | "system" | "error") {
  if (kind === "tool") return "border-sky-200 bg-sky-100 text-sky-800";
  if (kind === "assistant") return "border-stone-200 bg-stone-900 text-stone-50";
  if (kind === "error") return "border-rose-200 bg-rose-100 text-rose-800";
  return "border-stone-200 bg-stone-100 text-stone-700";
}

function stageTone(status: RunStageStatus) {
  if (status === "done") return "border-emerald-200 bg-emerald-50";
  if (status === "active") return "border-sky-200 bg-sky-50";
  if (status === "error") return "border-rose-200 bg-rose-50";
  if (status === "skipped") return "border-stone-200 bg-stone-50";
  return "border-stone-200 bg-white";
}

function statusTextTone(status: RunStageStatus) {
  if (status === "done") return "text-emerald-800";
  if (status === "active") return "text-sky-800";
  if (status === "error") return "text-rose-800";
  return "text-stone-700";
}

function splitAliases(raw: string) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function setParam(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  return next;
}

export default App;
