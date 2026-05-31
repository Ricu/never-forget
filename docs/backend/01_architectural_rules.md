# Backend Architectural Rules

This document defines the architectural rules for the backend in phase 1.

The goal is a backend that stays simple, supports the current product phase, and does not become muddy once the API and read side are added.

## Core Rules

### 1. Use hexagonal architecture

The backend follows hexagonal architecture:

* `domain` defines core concepts and contracts
* `application` coordinates use cases
* `adapters` connect the core to external intelligent systems
* `infrastructure` contains technical implementations
* `entrypoints` expose the backend to e.g. CLI and HTTP

### 2. Follow KISS

Prefer the simplest solution that supports the current phase.

Implications:

* keep the backend synchronous in phase 1
* avoid premature abstractions
* do not add infrastructure that is not solving a real problem yet

### 3. Apply DRY late, not early

Do not abstract on first use.

As a default, extract shared logic only once the same logic appears in more than three places or clear drift starts.

### 4. Keep entrypoints thin

CLI commands and future FastAPI routes should only:

* parse input
* call an application use case
* shape output

They should not contain orchestration logic or direct infrastructure calls.

### 5. Use a use-case-driven backend by default

The backend should be organized around use cases first, not generic CRUD services first.

Examples of use-case-oriented backend flows:

* capture ingestion
* batch ingestion
* review / correction
* read / query flows
* future retrieval flows

This does not forbid CRUD operations.

It means:

* CRUD is acceptable where it is naturally needed
* CRUD should support use cases
* CRUD should not become the default shape of the backend

### 6. Separate write-side and read-side concerns early

Write-side and read-side logic should not be merged into one catch-all service.

Write-side concerns:

* capture ingestion
* transcription
* extraction
* persistence

Read-side concerns:

* listing
* filtering
* aggregation
* query-specific shaping

Keep surfacing it explicitly when something is really a command/write concern vs a query/read concern, so the human can keep learning it through actual design decisions instead of abstract theory.

### 7. Prefer CQRS-lite thinking once read flows appear

The backend should follow CQRS-lite in spirit.

Meaning:

* write-side and read-side should be treated as different application concerns
* they may use different application services
* they may later use different data access shapes if needed

This does not mean introducing full CQRS or event sourcing.

It means being explicit when something is:

* a command / write concern
* a query / read concern

Whenever a design or implementation choice is influenced by this split, it should be surfaced explicitly to the human so the CQRS aspect stays visible.

## Practical Defaults

### Application layer

Prefer separate application services per use-case area.

Good direction:

* `CaptureIngestionService`
* future read/query service
* future review/edit service

Avoid:

* one large `MemoryService` or `BackendService` that keeps growing

### CRUD

CRUD is allowed where it is useful, especially in infrastructure or internal tooling.

But the public shape of the backend should still be use-case-driven by default.

### Read/write split

For now:

* it is fine that only the write side exists

When the read side starts:

* create separate read-oriented application flows early

### Wiring

Use one central composition path for wiring the backend together.

Avoid:

* each entrypoint creating its own object graph differently
* config access spreading across unrelated modules
