from __future__ import annotations

from pathlib import Path

from openai import OpenAI

from backend.domain.ports import TranscriptionPort
from backend.observability import observe


class OpenAITranscriptionAdapter(TranscriptionPort):
    _SUPPORTED_SUFFIXES = {
        ".wav",
        ".mp3",
        ".m4a",
        ".mp4",
        ".mpeg",
        ".mpga",
        ".webm",
        ".ogg",
        ".flac",
    }

    def __init__(self, model: str = "whisper-1") -> None:
        self._model = model
        self._client = OpenAI()

    def supported_suffixes(self) -> set[str]:
        return set(self._SUPPORTED_SUFFIXES)

    @observe(
        name="capture.transcribe_audio",
        as_type="generation",
        capture_input=False,
        capture_output=False,
    )
    def transcribe(self, audio_path: Path) -> str:
        suffix = audio_path.suffix.lower()
        if suffix not in self._SUPPORTED_SUFFIXES:
            supported = ", ".join(sorted(self._SUPPORTED_SUFFIXES))
            raise ValueError(
                f"Unsupported audio format '{suffix}'. Supported formats: {supported}"
            )

        with audio_path.open("rb") as handle:
            transcript = self._client.audio.transcriptions.create(
                model=self._model,
                file=handle,
            )
        text = getattr(transcript, "text", "")
        return text.strip()
