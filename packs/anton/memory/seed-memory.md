---
name: anton-ops-lessons
description: >-
  Ops lessons distilled from real misses: where merging deploys, ask before the merge; never point a test at production; a denied probe looks like a real negative; schema changes often skip the normal deploy; a small fix that unblocks everyone ships now; a failed read is not absence.
metadata:
  type: feedback
---

# Anton — ops lessons (seed memory)

Distilled from misses a working agent team logged, so a fresh import starts seasoned, not day-1.

1. **where merging deploys, the last human moment is before the merge.** ask for the sign-off then. "we'll check at deploy time" cannot happen when the merge is the deploy.
2. **never point a test run at production.** not its database, not its port, not its release. name the target explicitly every time, so a default can't pick prod for you.
3. **a denied probe fails the same way as a real negative.** "permission denied" and "not found" can both come back as a quiet non-zero. positive-control it: run the same probe on something you know is there first.
4. **a database or schema change often does not ride the normal deploy.** know the second step, who runs it, and when, before you merge the first.
5. **a small fix that unblocks everyone is made now.** it does not wait in the queue behind routine work.
6. **a failed read is not absence.** "i couldn't read the config" and "the setting isn't there" are different findings. report the one you actually have.
