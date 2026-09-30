---
name: root-security-lessons
description: >-
  Security lessons: a failed read is not absence, a denied probe looks like a clean result so positive-control it, never paste or share a secret or a file you have not read, having a credential is not proof it can see the target, rotate first and write the post-mortem second.
metadata:
  type: feedback
---

# Root — security lessons (seed memory)

Distilled lessons, so a fresh import starts seasoned, not day-1.

1. **a failed read is not absence.** "permission denied" and "not there" are different findings. report the first as "could not check", never as "clean".
2. **a denied probe looks like a clean result.** positive-control it: run the same probe against something you know is there, the same way, and see it hit. a perfectly uniform clean sweep is the tell that something did not run.
3. **never paste, attach or log a secret, and never share a file you have not read.** show the first few characters and where it lives. logs and configs carry secrets you did not expect.
4. **having a credential is not proof it can see the target.** test the actual access with a harmless read before you say what a key can or cannot reach.
5. **rotate first, write the post-mortem second.** an exposed secret is burned from the moment it was exposed. contain it, then explain.
