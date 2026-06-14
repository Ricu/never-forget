from __future__ import annotations

import sqlite3
from pathlib import Path

from pydantic import TypeAdapter
from pydantic_ai.messages import ModelMessage

from never_forget.domain.capture_sessions import CaptureSession, CaptureSessionStatus

MESSAGE_HISTORY_ADAPTER = TypeAdapter(list[ModelMessage])


class SqliteCaptureSessionRepository:
    def __init__(self, database_path: Path) -> None:
        self._database_path = database_path
        self._database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def create(self, session: CaptureSession) -> CaptureSession:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO capture_sessions (
                    id,
                    source_type,
                    status,
                    transcript,
                    message_history_json,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session.id,
                    session.source_type,
                    session.status.value,
                    session.transcript,
                    MESSAGE_HISTORY_ADAPTER.dump_json(session.message_history).decode("utf-8"),
                    session.created_at.isoformat(),
                    session.updated_at.isoformat(),
                ),
            )

        return session

    def get(self, session_id: str) -> CaptureSession | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT
                    id,
                    source_type,
                    status,
                    transcript,
                    message_history_json,
                    created_at,
                    updated_at
                FROM capture_sessions
                WHERE id = ?
                """,
                (session_id,),
            ).fetchone()

        if row is None:
            return None

        return self._row_to_capture_session(row)

    def update(self, session: CaptureSession) -> CaptureSession:
        with self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE capture_sessions
                SET
                    status = ?,
                    transcript = ?,
                    message_history_json = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    session.status.value,
                    session.transcript,
                    MESSAGE_HISTORY_ADAPTER.dump_json(session.message_history).decode("utf-8"),
                    session.updated_at.isoformat(),
                    session.id,
                ),
            )

        if cursor.rowcount == 0:
            return session

        return session

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS capture_sessions (
                    id TEXT PRIMARY KEY,
                    source_type TEXT NOT NULL CHECK (source_type IN ('direct_text')),
                    status TEXT NOT NULL CHECK (
                        status IN ('processing_underway', 'input_required', 'complete', 'failed')
                    ),
                    transcript TEXT NOT NULL,
                    message_history_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_capture_sessions_status_created_at
                ON capture_sessions (status, created_at DESC)
                """
            )

    @staticmethod
    def _row_to_capture_session(row: sqlite3.Row) -> CaptureSession:
        return CaptureSession(
            id=row["id"],
            source_type=row["source_type"],
            status=CaptureSessionStatus(row["status"]),
            transcript=row["transcript"],
            message_history=MESSAGE_HISTORY_ADAPTER.validate_json(row["message_history_json"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
