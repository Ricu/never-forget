from __future__ import annotations

import shutil
from pathlib import Path


class ManagedAudioStorage:
    def __init__(self, root: Path) -> None:
        self._root = root
        self._root.mkdir(parents=True, exist_ok=True)

    def store(self, *, capture_session_id: str, source_path: Path, suffix: str) -> str:
        normalized_suffix = suffix.lower() or source_path.suffix.lower()
        destination = self._root / f"{capture_session_id}{normalized_suffix}"
        shutil.copy2(source_path, destination)
        return str(destination)

    def store_bytes(
        self,
        *,
        capture_session_id: str,
        content: bytes,
        suffix: str,
    ) -> str:
        destination = self._root / f"{capture_session_id}{suffix.lower()}"
        destination.write_bytes(content)
        return str(destination)

    def delete(self, audio_ref: str | None) -> None:
        if not audio_ref:
            return
        path = Path(audio_ref)
        if path.exists():
            path.unlink()
