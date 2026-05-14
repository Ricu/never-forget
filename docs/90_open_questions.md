# Open Questions

This document collects unresolved product and design questions that are important enough to track but not yet ready to be decided.

The goal is not to force early answers. The goal is to make uncertainty visible, preserve reasoning context, and give future design work a clear place to continue from.

---

## How To Use This Document

Questions in this document should be:

* meaningful for product or architecture direction
* still unresolved
* phrased clearly enough that a future decision can be made

When a question is resolved, it should either be removed or replaced with a short note pointing to the document where the decision is now captured.

---

## Product Experience

### What Should "Good" Feel Like For The User?

The product aims to minimize friction during both capture and retrieval, but the desired user experience should be described more explicitly.

Questions to refine:

* What should a successful daily usage pattern look like?
* How much correction effort is acceptable before capture feels too heavy?
* What level of transparency should the system provide when it extracts or retrieves information?

---

## Capture System

### Which Input Surfaces Matter First?

Possible capture surfaces include:

* in-app voice recording
* audio upload
* direct text input
* messaging integrations
* mobile-first capture interfaces

Open question:

* which of these should be treated as first-class early product paths versus later extensions?

### How Should Clarification Loops Work?

The capture system may ask lightweight follow-up questions or allow user correction before persistence.

Open questions:

* when should the system interrupt the user for clarification?
* when should it make a best-effort guess instead?
* what kinds of ambiguity require explicit confirmation?

---

## Memory Store

### How Rich Should The Initial Stored Model Be?

The current direction is to keep the model simple and evolvable.

Open questions:

* how much structure should be extracted at ingestion time?
* which entity types beyond persons should exist early?
* how should provenance and correction history be represented conceptually?

---

## Exploration and Management

### Which Views Matter Most?

This component is still intentionally underdefined.

Open questions:

* which views provide the highest value first: timeline, contacts, tasks, relationship views, or something else?
* what should be optimized for browsing versus editing?
* how should users inspect why a memory or link exists?

---

## Assisted Retrieval

### What Should Retrieval Be Able To Do?

Assisted retrieval is expected to be a major product capability, but its scope is still open.

Open questions:

* should retrieval primarily answer questions, surface relevant memories, or actively synthesize across them?
* how should retrieval balance speed, explainability, and completeness?
* when should retrieval link back into manual exploration views?

---

## Cross-Cutting Questions

### How Should UX And AI Divide Responsibility?

The product relies on both interface design and AI support to reduce friction while preserving quality.

Open questions:

* which problems should be solved through deterministic UX patterns?
* which problems are best handled by LLM-driven assistance?
* where should the product avoid AI to preserve predictability and trust?

### How Should Offline-First Shape The Product?

Offline-first remains an important product direction.

Open questions:

* which capabilities must work fully offline?
* which capabilities may degrade gracefully when online services are unavailable?
* how should this affect input workflows, retrieval quality, and model choices?
