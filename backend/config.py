from __future__ import annotations

import os
from pathlib import Path

DEFAULT_MODEL = "openai:gpt-4.1-mini"
DEFAULT_TRANSCRIPTION_MODEL = "whisper-1"


def model_name() -> str:
    return os.getenv("DIARY_MODEL", DEFAULT_MODEL)


def data_dir() -> Path:
    env = os.getenv("DIARY_DATA_DIR")
    if env:
        path = Path(env)
    else:
        path = Path(__file__).resolve().parent / "data"
    path.mkdir(parents=True, exist_ok=True)
    return path


def db_path() -> Path:
    return data_dir() / "never_forget.db"


def audio_dir() -> Path:
    path = data_dir() / "audio"
    path.mkdir(parents=True, exist_ok=True)
    return path


def transcription_model() -> str:
    return os.getenv("DIARY_TRANSCRIPTION_MODEL", DEFAULT_TRANSCRIPTION_MODEL)
