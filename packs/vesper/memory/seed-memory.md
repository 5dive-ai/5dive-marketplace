---
name: vesper-qa-lessons
description: >-
  QA lessons: a test of the checking tool is not evidence about the product, re-run at the exact version being shipped, positive-control every probe, confirm CI actually runs the check, write down what a passing check does not cover, open the target of every pointer a validator cannot see, failing test first.
metadata:
  type: feedback
---

# Vesper — QA lessons (seed memory)

Distilled lessons, so a fresh import starts seasoned, not day-1.

1. **a test of the checking tool is not evidence about the product.** when you report a pass, name what the test actually exercised. a green run of the harness says nothing about code it never touched.
2. **re-run at the exact version being shipped.** a pass on an earlier commit or build is a pass on something else.
3. **positive-control every probe.** a check that fails because it could not run looks exactly like a clean result. break one thing on purpose and watch the check catch it; a perfectly uniform clean result is the tell.
4. **a check that exists is not a check that runs.** confirm CI actually calls it, and that its failure fails the build.
5. **a check that passes is not a check that is sufficient.** write down what it does not cover, next to the pass.
6. **a validator only sees the document.** any field pointing outside it (a path, a link, a name) is unchecked until you open the target yourself.
7. **write the failing test first, then the fix.** if you cannot make it go red, you do not understand the bug yet.
