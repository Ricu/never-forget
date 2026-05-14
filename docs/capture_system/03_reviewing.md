# Reviewing

The capture system is at the heart of the application.

## Review Timing

Variant 1 - Immediate Review

User has time not only for input but also to take a look at and react to what was put in. For example immediately after recording or issuieng the input, he could e.g.
- Take a look at the transcript and fix transcription errors
- Respond to questions or approval request by the system (e.g. "I have found 2 different possible person")
- Manually fix or provide follow-up instructions

These are activities the user does to ensure the generated memories are of high accuracy. The user might be in this <name_a> when he e.g.
- is in Bed
- on the train
- etc.

So generally situation where he has the time for an immediate review. BUT this does not mean we force him to finish it. It can always be, that the user might start reviewing and then has to stop. We should not punish him for that.


Variant 2 - Queued Review

User has NO time to review his capture. These are usually spontaneous situations where information just needs to get out of the head of the user. This might be:

- The user is in a rush but does not want to forget something he has to do
- The user can not access the main device right now and is only able to use a lightweight capture interface
- etc.

These cases probably are the more common ones and where high value lies, as it allows the user to capture things which he might otherwise not be able to. 

These capture sessions should be put into a capture / review queue. The user can them come back when he has the time to review it. This queue can also be used to pick up captures from variant 1, if the user had to leave in the middle of review.

### Review Queues

To enable the two review modes, we need a queue. ALL capture sessions should be put into the review queue. The real distinction is wether the user is immediately prompted to review or not.

