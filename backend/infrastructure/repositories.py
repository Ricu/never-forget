from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from backend.domain.models import (
    ArtifactInput,
    CaptureSession,
    LinkedEntityRef,
    Memory,
    Person,
    new_id,
    utc_now,
)
from backend.infrastructure.storage import SQLiteStore


def _load_json(value: str | None) -> object:
    if not value:
        return []
    return json.loads(value)


def _row_to_person(row: dict) -> Person:
    return Person(
        id=row["id"],
        name=row["name"],
        aliases=list(_load_json(row["aliases"])),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_capture_session(row: dict) -> CaptureSession:
    return CaptureSession(
        id=row["id"],
        audio_ref=row["audio_ref"],
        transcript=row["transcript"],
        transcript_segments=_load_json(row["transcript_segments"]) or None,
        metadata=dict(_load_json(row["metadata"])),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_memory(row: dict) -> Memory:
    return Memory(
        id=row["id"],
        capture_session_id=row["capture_session_id"],
        type=row["type"],
        title=row["title"],
        text=row["text"],
        linked_entities=[
            LinkedEntityRef.model_validate(ref)
            for ref in list(_load_json(row["linked_entities"]))
        ],
        timeline_at=row["timeline_at"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


class SQLitePersonRepository:
    def __init__(self, db_path: Path) -> None:
        self.store = SQLiteStore(db_path)

    def search_persons(self, query: str, limit: int = 10) -> list[Person]:
        q = query.strip()
        if not q:
            return []
        like = f"%{q.casefold()}%"
        with self.store.connect() as conn:
            rows = conn.execute(
                """
                SELECT id, name, aliases, created_at, updated_at
                FROM persons
                WHERE lower(name) LIKE ?
                   OR lower(aliases) LIKE ?
                ORDER BY updated_at DESC
                LIMIT ?
                """,
                (like, like, limit),
            ).fetchall()

        return [_row_to_person(row) for row in rows]

    def list_persons(self, query: str | None = None) -> list[Person]:
        q = (query or "").strip()
        sql = """
            SELECT id, name, aliases, created_at, updated_at
            FROM persons
        """
        params: tuple = ()
        if q:
            like = f"%{q.casefold()}%"
            sql += """
            WHERE lower(name) LIKE ?
               OR lower(aliases) LIKE ?
            """
            params = (like, like)
        sql += " ORDER BY updated_at DESC"
        with self.store.connect() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [_row_to_person(row) for row in rows]

    def get_person(self, person_id: str) -> Person | None:
        with self.store.connect() as conn:
            row = conn.execute(
                """
                SELECT id, name, aliases, created_at, updated_at
                FROM persons
                WHERE id = ?
                """,
                (person_id,),
            ).fetchone()
        if row is None:
            return None
        return _row_to_person(row)

    def create_person(
        self,
        name: str,
        aliases: list[str] | None = None,
    ) -> Person:
        now = utc_now()
        person = Person(
            id=new_id("person"),
            name=name.strip(),
            aliases=[alias.strip() for alias in aliases or [] if alias.strip()],
            created_at=now,
            updated_at=now,
        )

        with self.store.connect() as conn:
            conn.execute(
                """
                INSERT INTO persons (id, name, aliases, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    person.id,
                    person.name,
                    json.dumps(person.aliases),
                    person.created_at.isoformat(),
                    person.updated_at.isoformat(),
                ),
            )
            conn.commit()

        return person

    def update_person(
        self,
        person_id: str,
        *,
        name: str,
        aliases: list[str],
    ) -> Person | None:
        now = utc_now().isoformat()
        with self.store.connect() as conn:
            conn.execute(
                """
                UPDATE persons
                SET name = ?, aliases = ?, updated_at = ?
                WHERE id = ?
                """,
                (name.strip(), json.dumps(aliases), now, person_id),
            )
            conn.commit()
        return self.get_person(person_id)


class SQLiteCaptureSessionRepository:
    def __init__(self, db_path: Path) -> None:
        self.store = SQLiteStore(db_path)

    def create_capture_session(
        self,
        transcript: str,
        audio_ref: str | None = None,
        metadata: dict | None = None,
        preferred_id: str | None = None,
    ) -> CaptureSession:
        now = utc_now()
        session = CaptureSession(
            id=preferred_id or new_id("capture"),
            audio_ref=audio_ref,
            transcript=transcript,
            transcript_segments=None,
            metadata=metadata or {},
            created_at=now,
            updated_at=now,
        )

        with self.store.connect() as conn:
            conn.execute(
                """
                INSERT INTO capture_sessions (
                    id,
                    audio_ref,
                    transcript,
                    transcript_segments,
                    metadata,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session.id,
                    session.audio_ref,
                    session.transcript,
                    None,
                    json.dumps(session.metadata),
                    session.created_at.isoformat(),
                    session.updated_at.isoformat(),
                ),
            )
            conn.commit()

        return session

    def list_capture_sessions(self) -> list[CaptureSession]:
        with self.store.connect() as conn:
            rows = conn.execute(
                """
                SELECT id, audio_ref, transcript, transcript_segments, metadata,
                       created_at, updated_at
                FROM capture_sessions
                ORDER BY updated_at DESC
                """
            ).fetchall()
        return [_row_to_capture_session(row) for row in rows]

    def get_capture_session(self, capture_session_id: str) -> CaptureSession | None:
        with self.store.connect() as conn:
            row = conn.execute(
                """
                SELECT id, audio_ref, transcript, transcript_segments, metadata,
                       created_at, updated_at
                FROM capture_sessions
                WHERE id = ?
                """,
                (capture_session_id,),
            ).fetchone()
        if row is None:
            return None
        return _row_to_capture_session(row)

    def update_capture_session(
        self,
        capture_session_id: str,
        *,
        transcript: str | None = None,
        metadata: dict | None = None,
    ) -> CaptureSession | None:
        existing = self.get_capture_session(capture_session_id)
        if existing is None:
            return None

        next_metadata = metadata if metadata is not None else existing.metadata
        next_transcript = transcript if transcript is not None else existing.transcript
        now = utc_now().isoformat()
        with self.store.connect() as conn:
            conn.execute(
                """
                UPDATE capture_sessions
                SET transcript = ?, metadata = ?, updated_at = ?
                WHERE id = ?
                """,
                (next_transcript, json.dumps(next_metadata), now, capture_session_id),
            )
            conn.commit()
        return self.get_capture_session(capture_session_id)

    def delete_capture_session(self, capture_session_id: str) -> bool:
        with self.store.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM capture_sessions WHERE id = ?",
                (capture_session_id,),
            )
            conn.commit()
        return cursor.rowcount > 0


class SQLiteArtifactRepository:
    def __init__(self, db_path: Path) -> None:
        self.store = SQLiteStore(db_path)

    def ingest_artifacts(
        self,
        capture_session_id: str,
        memories: list[ArtifactInput],
    ) -> list[Memory]:
        now = utc_now()
        created: list[Memory] = []

        with self.store.connect() as conn:
            for item in memories:
                memory = Memory(
                    id=new_id("memory"),
                    capture_session_id=capture_session_id,
                    type=item.type,
                    title=item.title,
                    text=item.text,
                    linked_entities=item.linked_entities,
                    timeline_at=item.timeline_at,
                    created_at=now,
                    updated_at=now,
                )
                conn.execute(
                    """
                    INSERT INTO memories (
                        id,
                        capture_session_id,
                        type,
                        title,
                        text,
                        linked_entities,
                        timeline_at,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        memory.id,
                        memory.capture_session_id,
                        memory.type,
                        memory.title,
                        memory.text,
                        json.dumps(
                            [
                                ref.model_dump(mode="json")
                                for ref in memory.linked_entities
                            ]
                        ),
                        str(memory.timeline_at)
                        if memory.timeline_at is not None
                        else None,
                        memory.created_at.isoformat(),
                        memory.updated_at.isoformat(),
                    ),
                )
                created.append(memory)
            conn.commit()

        return created

    def list_memories(
        self,
        *,
        query: str | None = None,
        memory_type: str | None = None,
    ) -> list[Memory]:
        clauses: list[str] = []
        params: list[str] = []
        if query:
            like = f"%{query.casefold()}%"
            clauses.append("(lower(text) LIKE ? OR lower(coalesce(title, '')) LIKE ?)")
            params.extend([like, like])
        if memory_type:
            clauses.append("type = ?")
            params.append(memory_type)

        sql = """
            SELECT id, capture_session_id, type, title, text, linked_entities,
                   timeline_at, created_at, updated_at
            FROM memories
        """
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY updated_at DESC"
        with self.store.connect() as conn:
            rows = conn.execute(sql, tuple(params)).fetchall()
        return [_row_to_memory(row) for row in rows]

    def list_memories_for_capture_session(
        self, capture_session_id: str
    ) -> list[Memory]:
        with self.store.connect() as conn:
            rows = conn.execute(
                """
                SELECT id, capture_session_id, type, title, text, linked_entities,
                       timeline_at, created_at, updated_at
                FROM memories
                WHERE capture_session_id = ?
                ORDER BY created_at DESC
                """,
                (capture_session_id,),
            ).fetchall()
        return [_row_to_memory(row) for row in rows]

    def list_memories_for_person(self, person_id: str) -> list[Memory]:
        return [
            memory
            for memory in self.list_memories()
            if any(
                ref.type == "person" and ref.id == person_id
                for ref in memory.linked_entities
            )
        ]

    def get_memory(self, memory_id: str) -> Memory | None:
        with self.store.connect() as conn:
            row = conn.execute(
                """
                SELECT id, capture_session_id, type, title, text, linked_entities,
                       timeline_at, created_at, updated_at
                FROM memories
                WHERE id = ?
                """,
                (memory_id,),
            ).fetchone()
        if row is None:
            return None
        return _row_to_memory(row)

    def update_memory(
        self,
        memory_id: str,
        *,
        type: str,
        title: str | None,
        text: str,
        linked_entities: list[LinkedEntityRef],
        timeline_at: datetime | str | None,
    ) -> Memory | None:
        now = utc_now().isoformat()
        with self.store.connect() as conn:
            conn.execute(
                """
                UPDATE memories
                SET type = ?, title = ?, text = ?, linked_entities = ?,
                    timeline_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    type,
                    title,
                    text,
                    json.dumps(
                        [ref.model_dump(mode="json") for ref in linked_entities]
                    ),
                    str(timeline_at) if timeline_at is not None else None,
                    now,
                    memory_id,
                ),
            )
            conn.commit()
        return self.get_memory(memory_id)

    def delete_memory(self, memory_id: str) -> bool:
        with self.store.connect() as conn:
            cursor = conn.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            conn.commit()
        return cursor.rowcount > 0

    def delete_memories_for_capture_session(self, capture_session_id: str) -> int:
        with self.store.connect() as conn:
            cursor = conn.execute(
                "DELETE FROM memories WHERE capture_session_id = ?",
                (capture_session_id,),
            )
            conn.commit()
        return cursor.rowcount
