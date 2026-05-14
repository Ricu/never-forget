from __future__ import annotations

from dataclasses import dataclass, field

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from backend.config import model_name as default_model_name
from backend.domain.models import ArtifactInput, ExtractionResult
from backend.domain.ports import ArtifactCommandPort, PersonCommandPort, PersonQueryPort


@dataclass
class AgentDeps:
    capture_session_id: str
    person_query: PersonQueryPort
    person_command: PersonCommandPort
    artifact_command: ArtifactCommandPort
    created_person_ids: list[str] = field(default_factory=list)
    persisted_artifact_ids: list[str] = field(default_factory=list)


class PersonSearchHit(BaseModel):
    id: str = Field(
        description="Identifier of an existing person that a memory may link to."
    )
    name: str = Field(description="Primary display name for the person.")
    aliases: list[str] = Field(
        default_factory=list,
        description="Known aliases, nicknames, or alternate spellings for the person.",
    )


class CreatedPerson(BaseModel):
    id: str = Field(description="Identifier of the newly created person.")
    name: str = Field(description="Primary display name stored for the new person.")


class IngestArtifactsResponse(BaseModel):
    artifact_ids: list[str] = Field(
        description="IDs of the memories persisted for this capture session."
    )
    count: int = Field(description="Number of memories persisted in the batch.")


EXTRACTION_INSTRUCTIONS = """
You are the extraction step for Never Forget.

You receive the transcript of exactly one capture session and turn it into zero
or more persisted memories.

Primary goals:
- Extract durable, useful memories from the transcript.
- Preserve the user's meaning, wording, intent, uncertainty, and language.
- Improve readability by removing obvious filler and resolving references when
  it is safe to do so.
- Do not invent facts, motivations, causes, or conclusions.
- Do not update or manage stored memories. Your scope is limited to linking
  persons, creating missing persons, and persisting this run's extracted
  memories.

Memory writing rules:
- A single capture session may produce zero, one, or many memories.
- Use the most specific memory type available:
  `moment`, `friend_note`, `idea`, `todo`, `symptom`, `miscellaneous`.
- The general goal is: Clean up spoken language into readable memory text
  without changing meaning or losing nuance.
- Here are some general styling guidelines to ensure there a degree of
  consistency and quality across all memories.
- Memories should...
  - ... be plain text at heart.
  - ... preserve content, wording, intent and lines of thought.
  - ... improve sentence flow, reference clarity, and readability.
  - ... be adapted to the language used by the user / in the transcript.
  - ... not drop any information, unless it is very obviously filler from the
    conversation (examples for filler: "So um yeah,...", "Well anyway...")
  - ... not include recording date unless it is relevant to the memory itself.
  - ... fullfill the users specific intent if the transcript contains one.
  - ... not infer extra meaning, causes, or conclusions unless the user
    explicitly states them.
- In addition to the general stylings, "Moments" should...
  - ... be first person, past tense personal recollections.
  - ... feel like a remembered lived situation, not a log entry.
  - ... only be split into multiple moments if there is a real experiential
    shift.
- In addition to the general stylings, "Friend Notes" should...
  - ... be written in third person.
  - ... make sure that even details about a person are captured.
  - ... keep relational context when it adds meaning, source clarity, or social
    context.
- In addition to the general stylings, "ToDos" should...
  - ... focus on the "event" (i.e. the change), not the state of a task.
  - ... should not merge multiple ToDos into one.
  - ... follow the semi-structured pattern below.
- A todo consists of a summary sentence and an optional paragraph with details.
  The summary sentence follows a pattern which should follow a canonical form.
- The first summary sentence should express the task event in a small natural
  pattern (in the suitable language):
  - “I need to …” for open or newly relevant tasks
  - “I no longer need to …” for tasks that should no longer remain open
  - “by …” for deadlines
- The optional details section is a second paragraph which may add context,
  reason, outcome, or relevant details.
- In addition to the general stylings, "Idea" should...
  - ... preserve the original line of thought and respect intent as much as
    possible.
  - ... not flatten everything into a thematic summary unless the user
    explicitly wants that.
  - ... preserve uncertainty and open questions.
  - ... make it easier to reread later.
- In addition to the general stylings, "Symptoms" should...
  - ... be first person and observational.
  - ... improve phrasing but do not medicalize the language.
  - ... keep relevant situational context, timing, or recurrence if mentioned.
- As this is the capture net for information that can not be categorized, we do
  not impose any special style apart from the general rules.
- Add `title` only when a short title improves scanability.

Linking and identity rules:
- Use linked entities as `linked_entities: [{"type": "person", "id": "..."}]`.
- Only link memories to stable non-memory entities. Currently the only
  supported linked entity type is `person`.
- When a person is mentioned, call `search_persons` before deciding whether to
  create a new person.
- If `search_persons` returns a suitable existing person, use that person's
  canonical `name` in the memory text and title rather than copying a transcript
  alias, nickname, shorthand, or misspelling.
- Reuse an existing person only when the match is clearly correct.
- If the transcript clearly identifies a person and no existing person is a
  clear match, call `create_person`.
- If the transcript does not provide enough stable identity to create a person
  confidently, keep the memory unlinked instead of guessing.

Timeline rules:
- Leave `timeline_at` unset when the memory belongs to the capture time.
- Set `timeline_at` only when the transcript clearly places the memory at a
  different time than the capture session.

Persistence and response rules:
- Collect the complete set of memories first, then call `ingest_artifacts`
  exactly once.
- If the transcript contains no memory-worthy information, call
  `ingest_artifacts` with an empty list.
- Do not ask follow-up questions.
- After tool use, return `ExtractionResult`.
- The final `ExtractionResult` must include `capture_session_id`.
- Include `persisted_artifact_ids` and `created_person_ids` from the tool
  results whenever available.
""".strip()


def build_extraction_agent(
    model: str | None = None,
) -> Agent[AgentDeps, ExtractionResult]:
    agent = Agent[AgentDeps, ExtractionResult](
        model=model or default_model_name(),
        deps_type=AgentDeps,
        output_type=ExtractionResult,
        instructions=EXTRACTION_INSTRUCTIONS,
    )

    @agent.tool(
        docstring_format="google",
        require_parameter_descriptions=True,
    )
    def search_persons(
        ctx: RunContext[AgentDeps],
        query: str,
        limit: int = 10,
    ) -> list[PersonSearchHit]:
        """Search existing persons by name or alias before creating a new one.

        When a returned person is the correct match, use that person's
        canonical `name` in the extracted memory text and title.

        Args:
            ctx: Run-scoped dependencies for person lookup.
            query: Name, alias, or short identifying phrase taken from the transcript.
            limit: Maximum number of candidate person matches to return.
        """
        people = ctx.deps.person_query.search_persons(query=query, limit=limit)
        return [
            PersonSearchHit(id=person.id, name=person.name, aliases=person.aliases)
            for person in people
        ]

    @agent.tool(
        docstring_format="google",
        require_parameter_descriptions=True,
    )
    def create_person(
        ctx: RunContext[AgentDeps],
        name: str,
        aliases: list[str] | None = None,
    ) -> CreatedPerson:
        """Create a new person entity mentioned in the current transcript.

        Use this only after `search_persons` when no existing person is a clear
        match.

        Args:
            ctx: Run-scoped dependencies for person creation.
            name: Primary display name for the new person.
            aliases: Alternate names, nicknames, or spellings supported by
                the transcript.
        """
        person = ctx.deps.person_command.create_person(
            name=name,
            aliases=aliases,
        )
        ctx.deps.created_person_ids.append(person.id)
        return CreatedPerson(id=person.id, name=person.name)

    @agent.tool(
        docstring_format="google",
        require_parameter_descriptions=True,
    )
    def ingest_artifacts(
        ctx: RunContext[AgentDeps],
        memories: list[ArtifactInput],
    ) -> IngestArtifactsResponse:
        """Persist the full batch of memories extracted from this capture session.

        Call this exactly once after person resolution is complete. Pass an
        empty list when the transcript contains no memory-worthy content.

        Args:
            ctx: Run-scoped dependencies for artifact persistence.
            memories: Complete list of memories to persist for this capture session.
        """
        created = ctx.deps.artifact_command.ingest_artifacts(
            capture_session_id=ctx.deps.capture_session_id,
            memories=memories,
        )
        ids = [memory.id for memory in created]
        ctx.deps.persisted_artifact_ids.extend(ids)
        return IngestArtifactsResponse(artifact_ids=ids, count=len(ids))

    return agent
