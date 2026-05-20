# Capturing Input

The capture system starts with user input.

## Capture Interface

A **Capture Interface** is any user-facing interface through which information enters the Never Forget system. Its sole responsibility is to allow users to quickly submit thoughts, observations, or reminders into the capture system with minimal friction.

Capture Interfaces act as the **entry point of the capture system**, converting user interaction into a **Capture Session**. They do not perform semantic processing or categorization themselves; their role is limited to collecting the user's input and creating or forwarding it into the capture-session flow.

A Capture Interface typically performs the following responsibilities:

- collect user input (voice, text, or other content)
- initiate a **Capture Session**
- attach any relevant metadata (timestamp, device source, attachments)
- forward the captured input for preprocessing and LLM processing

Once input is submitted, the Capture Interface's role ends and the capture system takes over.

Examples of Capture Interfaces include:

- **Mobile App Voice Recorder** - the primary interface for capturing spoken thoughts.
- **Web Application Input UI** - allows direct text or audio capture from a browser.
- **Share / "Send to Never Forget" Extension** - captures text, URLs, or media from other applications.
- **WearOS Quick Capture** - enables fast voice notes from a wearable device.
- **Messaging Integration (e.g., Telegram Bot)** - allows users to send messages that are treated as capture input.

All Capture Interfaces ultimately produce the same output: a **Capture Session**.

## Product Workflow

### Step 1 - Capture

User records audio or submits another supported input.

System creates a CaptureSession.

The CaptureSession is registered in the review queue.

### Step 2 - Preprocessing

Audio is transcribed using ASR.

Transcript is stored in the CaptureSession.

### Step 3 - LLM Processing

The transcript or submitted text is provided to an LLM.

The LLM extracts memories representing meaningful information.

### Step 4 - Persistence

Memories are persisted using a batch ingestion tool.

Persisted artifacts should generally be immediately available to the rest of the system.

## Capture Session

Represents a single capture event.

Fields:

- id
- audio_ref
- transcript
- transcript_segments (optional)
- created_at
- metadata

Notes:

CaptureSession management is handled by orchestration and not exposed to the LLM.
