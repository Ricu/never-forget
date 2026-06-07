# Capture Review And Interactivity Input

Timestamp: 2026-05-20 17:21 +02:00

This note preserves the user's input near-verbatim. Spelling and punctuation were lightly cleaned for readability. Bracketed notes add context where the input references earlier discussion.

---

Okay. I just thought about it. I think we can start by ignoring interactivity. The reason is: we can put the interactivity into the review.

Example:

User says: "I just learned that Anna is from Berlin". The agent looks up which "Annas" there are and finds two potential matches. Now a potential interactivity could be: agent uses a tool with like `askQuestion`, where the user is asked which of the identified Annas is the correct one.

Why this example shows we can put this into review: If we are in an "immediate" interaction mode (e.g. live conversation), the user will see or hear this question and immediately answer, continuing the interaction with the agent. But in agent interactions there is a difference between a conversation thread and an agent run. Per rule of thumb, a run starts when there is user input. This means, we can simply store the state of the conversation thread and when the user is ready for review, he answers the question and thereby triggers the rest of the agent run.

Though I would not consider agents conversation threads as first class objects. There is some friction here: e.g. what happens when the user reviews other parts of the capture session? E.g. modify the transcript or do something else.

Coming back to your `Capture input -> transcript -> agent run -> draft artifacts -> optional interaction/review -> persistence`: [This refers to the assistant's earlier proposed capture flow.]

1. Between transcript and artifacts we will have the agent's run, which in itself calls tools, some of which can be interactive. The interaction therefore comes before the artifacts. This simply means that the steps between transcript and artifacts are non-deterministic in parts and not a deterministic flow.

2. Review is then essentially just: our capture is simply in some state of this "pipeline". E.g. the agent can have already created the artifacts or maybe we are still stuck at an earlier part where input is still created.

3. There are various ways in which we might do corrections/updates. This can be the user manually editing the transcript, changing answers to questions, directly modifying artifacts or adding new info (e.g. via new voice audio or other). I think getting this right is some more work. Because while editing artifacts is essentially just a CRUD operation, all corrections during or before the agent runs would retrigger a non-deterministic section of the pipeline. How we handle this needs to be clarified later.

4. On drafting and persistence:

A) I generally want to try to avoid the capture pipeline getting stuck where possible and favor ending in actual artifacts. There might be some cases where this is not sensible, like the Anna disambiguation, but those should not be the norm.

B) I do not want the generated artifacts having to be reviewed to be usable. Simple scenario: One input is "I need to contact person X" and then shortly after I enter "When contacting person X, I should not forget Y". If artifacts are not immediately usable, I would need a review between the two inputs before the second could append information to the todo generated in the first. Also: if I would like to query any of that information shortly after creating it, I might be bottlenecked by my review process. Instead, I prefer a way where the information extracted from the capture sessions is immediately available to the system. Edits, review, and correction should then simply update the information. If this happens via mutable memories or via some append-only versioned thing or whatever is not our concern right now.

Now on to some more "journeys". Please add a new document where we put those.

1. "I still need to do my tax"

Should fall into the todo event type and reflect in persistent todos. Either create a new one if exists or not. Possible interactivity could be that a match to an existing persistent todo needs to be verified.

2. "I just learned that Anna's birthday is on the 20th of January".

It is a person info event type. This one is interesting because it is valuable to map it to a specific field later in the Person. There could be some disambiguation work as interaction, similar to above. As with any other Person Info memory, there can also always be the case that no suitable version can be found. This could also be due to transcription errors, and the user needs to validate whether there is a match that the agent did not find or a new person needs to be created.

3. "<a relatively obviously nonsensical transcription>"

This can happen due to bad translation. In such a case this should be surfaced during review/interactivity. As a late-stage fallback, there is audio that can be reviewed by the user. Apart from that, the user may directly fix the transcription manually.

4. "A relatively long recording with multiple topics and involved entities"

Challenge here is clearly separating between the different types of events, with the correct granularities, correct phrasing, and with the correct information.

5. "Google is an interesting employer"

This could be context dependent. If there is a todo along the lines of search for jobs, this is where it would fit. If there is an Idea along the lines of "Interesting Employers", it would better be an idea fragment. If there is neither, we probably need some interactivity to find out what to do with it.

Whenever you write documentation, only base it on what I wrote or clearly confirmed. Docs should be high signal-to-noise ratio. Please reconfirm with me the documentation you would create/update by telling me the affected files and briefly what you would change.

I think the above thoughts confirm that we should for now think of always having a queued review which the user will do later. We should only have immediate reviews in the back of our mind when appropriate, such that immediate review is just a matter of orchestrating the right UI / functions at the right time, rather than having a separate system.

Please make sure to not miss any information when documenting. Please also document my input here in a separate document, where my raw input is persisted with timestamps near verbatim. Simply make it more pleasant to read and make sure that things I am referencing are spelled out, e.g. when I am referencing something you said, briefly add a note explaining it.
