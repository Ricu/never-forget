# Reviewing

Review is based on a queue. All capture sessions should be registered in the review queue when they are created. The difference between immediate and deferred review is whether the user is shown the review surface right away.

The review queue is the surface for capture sessions that need attention now. It may contain capture sessions in different states. A session may already have persisted artifacts, may still be processing, may require user input, or may have failed.

## Review Timing

### Variant 1 - Immediate Review

User has time not only for input but also to take a look at and react to what was put in. For example immediately after recording or issuing the input, the user could:

- take a look at the transcript and fix transcription errors
- inspect extracted memories
- respond when the system requires user input

These are examples, not an exhaustive list. These are activities the user does to improve or resume the capture session.

The user might be in this mode when he:

- is in bed
- is on the train
- has time for an immediate review

Immediate review does not mean the user is forced to finish the review. The user may start reviewing and then stop. The system should not punish that.

### Variant 2 - Queued Review

User has no time to review his capture. These are usually spontaneous situations where information just needs to get out of the user's head. This might be:

- the user is in a rush but does not want to forget something he has to do
- the user cannot access the main device right now and is only able to use a lightweight capture interface

These cases are probably the more common ones and where high value lies, as it allows the user to capture things which he might otherwise not be able to.

These capture sessions should be put into the review queue. The user can then come back when he has the time to review them. This queue can also be used to pick up captures from immediate review if the user had to leave in the middle of review.

## Review Queues

To enable the two review modes, we need a queue. All capture sessions should be registered there at creation time, and the queue should surface whichever sessions need attention now. The real distinction is whether the user is immediately prompted to review or not.

Immediate review should therefore be treated as orchestration of the same review mechanism, not as a separate capture system.

Marking a capture session as reviewed should be understood narrowly: it means the session does not need to remain in the review queue right now. It does not mean the extracted information is permanently approved or final.

## Corrections

Review may involve corrections at different points in the capture session. For example, the user may fix the transcript, respond when the system requires user input, or change an earlier answer.

Corrections that affect preprocessing or LLM processing may require rerunning a non-deterministic part of the pipeline. The exact correction and reprocessing model is unresolved.
