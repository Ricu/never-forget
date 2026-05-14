# backend

Never Forget prototype with hexagonal architecture, SQLite persistence, and PydanticAI extraction tools.

## Architecture

- `domain`: core entities and ports (`CaptureSession`, `Memory`, `Person`).
- `application`: orchestration service for single and batch capture ingestion.
- `adapters`: PydanticAI extraction agent + model-facing tools.
- `infrastructure`: SQLite repositories and OpenAI transcription adapter.
- `entrypoints`: CLI interfaces.

## Product-aligned Flow

1. Input capture (`text`, `.txt/.md`, or audio file).
2. Create one `CaptureSession` per input.
3. If audio, transcribe first.
4. Run LLM extraction for that session.
5. Persist memories in one batch tool call.

## LLM Tools

- `search_persons(query, limit=10)`
- `create_person(name, aliases=None)`
- `ingest_artifacts(memories)`

Memory links use:

```json
"linked_entities": [
  { "type": "person", "id": "person_123" }
]
```

## Storage

SQLite DB:

- `backend/data/never_forget.db` (default)

Tables:

- `capture_sessions`
- `memories`
- `persons`

## Single CLI

```bash
python -m backend.entrypoints.single_cli --text "Call the dentist tomorrow"
```

```bash
python -m backend.entrypoints.single_cli --file path/to/note.md
```

```bash
python -m backend.entrypoints.single_cli --file path/to/voice.m4a
```

Optional:

- `--capture-session-id custom_id`
- `--model openai:gpt-4.1-mini`

## Batch CLI

Batch input supports:

- folder: processes all supported files inside (one file = one capture session)
- `.jsonl`
- `.json`
- single `.txt/.md` or audio file

```bash
python -m backend.entrypoints.batch_cli --input path/to/folder
```

```bash
python -m backend.entrypoints.batch_cli --input path/to/batch.jsonl
```

JSON/JSONL items can be:

- string: treated as transcript text
- object with `text` or `transcript`
- object with `file` or `audio` or `path`
- optional `id` / `capture_session_id`

Relative file paths inside JSON/JSONL are resolved relative to that JSON file.

## Supported Audio Formats

Transcription adapter supports:

- `.wav`, `.mp3`, `.m4a`, `.mp4`, `.mpeg`, `.mpga`, `.webm`, `.ogg`, `.flac`

## Config

- `DIARY_MODEL` extraction model (default `openai:gpt-4.1-mini`)
- `DIARY_TRANSCRIPTION_MODEL` ASR model (default `whisper-1`)
- `DIARY_DATA_DIR` data directory override

OpenAI credentials are required for extraction/transcription.
