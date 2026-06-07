# Preprocessing

Preprocessing prepares captured input for LLM processing.

This stage should cover mechanical transformations that happen before semantic extraction. It is expected to be more deterministic than LLM processing.

## Responsibilities

- normalize captured input into a processable form
- store uploaded or recorded audio as managed capture-session input
- create a transcript when the input is audio
- store the transcript on the capture session
- preserve enough source material for later review, especially when transcription quality is poor

## Transcription Quality

Some captures may produce unusable or obviously nonsensical transcripts. In those cases, the capture session should remain reviewable. The user may later inspect the transcript, fix it manually, or use the original audio as a fallback reference.

Preprocessing should not decide the semantic meaning of the capture. That belongs to LLM processing.
