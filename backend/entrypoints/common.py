from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.application.inputs import CaptureSource

TEXT_SUFFIXES = {".txt", ".md"}


def load_batch_sources(path: Path, audio_suffixes: set[str]) -> list[CaptureSource]:
    resolved = path.resolve()
    if resolved.is_dir():
        return _from_folder(resolved, audio_suffixes)

    suffix = resolved.suffix.lower()
    if suffix == ".jsonl":
        return _from_jsonl(resolved)
    if suffix == ".json":
        return _from_json(resolved)
    if suffix in TEXT_SUFFIXES or suffix in audio_suffixes:
        return [CaptureSource(file_path=resolved)]

    raise ValueError(
        f"Unsupported batch input '{resolved}'. Use folder, .jsonl, .json, "
        f"text {sorted(TEXT_SUFFIXES)}, or audio {sorted(audio_suffixes)}"
    )


def _from_folder(path: Path, audio_suffixes: set[str]) -> list[CaptureSource]:
    rows: list[CaptureSource] = []
    for child in sorted(path.iterdir()):
        if not child.is_file():
            continue
        suffix = child.suffix.lower()
        if suffix in TEXT_SUFFIXES or suffix in audio_suffixes:
            rows.append(CaptureSource(file_path=child))
    return rows


def _from_jsonl(path: Path) -> list[CaptureSource]:
    rows: list[CaptureSource] = []
    for index, line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        stripped = line.strip()
        if not stripped:
            continue
        row = json.loads(stripped)
        if isinstance(row, str):
            rows.append(CaptureSource(capture_session_id=f"line_{index}", text=row))
            continue
        if isinstance(row, dict):
            rows.append(_coerce_item(path.parent, row, fallback_id=f"line_{index}"))
            continue
        raise ValueError(f"Unsupported JSONL item at line {index}")
    return rows


def _from_json(path: Path) -> list[CaptureSource]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("JSON batch input must be a list")

    rows: list[CaptureSource] = []
    for index, item in enumerate(payload, start=1):
        if isinstance(item, str):
            rows.append(CaptureSource(capture_session_id=f"item_{index}", text=item))
            continue
        if isinstance(item, dict):
            rows.append(_coerce_item(path.parent, item, fallback_id=f"item_{index}"))
            continue
        raise ValueError(f"Unsupported JSON item at index {index}")
    return rows


def _coerce_item(
    base_dir: Path, item: dict[str, Any], fallback_id: str
) -> CaptureSource:
    capture_id = item.get("id") or item.get("capture_session_id") or fallback_id

    text = item.get("text") or item.get("transcript")
    if isinstance(text, str) and text.strip():
        return CaptureSource(capture_session_id=str(capture_id), text=text)

    file_value = item.get("file") or item.get("audio") or item.get("path")
    if isinstance(file_value, str) and file_value.strip():
        file_path = Path(file_value)
        if not file_path.is_absolute():
            file_path = (base_dir / file_path).resolve()
        return CaptureSource(capture_session_id=str(capture_id), file_path=file_path)

    raise ValueError(f"Invalid batch item for capture_session_id={capture_id}")
