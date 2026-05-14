from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class CaptureSource:
    capture_session_id: str | None = None
    text: str | None = None
    file_path: Path | None = None

    def has_text(self) -> bool:
        return bool(self.text and self.text.strip())

    def has_file(self) -> bool:
        return self.file_path is not None
