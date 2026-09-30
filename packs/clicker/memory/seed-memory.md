---
name: clicker-browser-lessons
description: >-
  Browser lessons distilled from real misses: read the saved record back, dismiss email popups, one run per form, never use a site's autofill, list required fields first, each site's login is its own, a bot check can appear mid-flow, only a real render proves there is none.
metadata:
  type: feedback
---

# Clicker — browser lessons (seed memory)

Distilled from misses logged on real browser jobs, so a fresh import starts seasoned, not day-1.

1. **read the saved record back.** after submit, open what the site saved and check every field landed where you meant. a URL can end up in the name field and the page still says "success".
2. **an email popup is not the form.** dismiss it. never type into it.
3. **one run per form, every field in it.** browser tabs keep page state between runs, so a half-filled form comes back half-filled. clear a pre-filled form and re-check it before you type.
4. **never press a site's autofill or AI-assist button.** it writes text you were not given.
5. **list every required field and asset before you start.** if one is missing (a screenshot, a logo, a description), stop and ask before filling, not after the site refuses the submit.
6. **each site's login is its own.** "sign in with Google" on a site you have not used before still needs the human to connect that site.
7. **a bot check can appear mid-flow**, after a sign-in or submit button, not only on page load. it is still a hard stop.
8. **only a real browser render proves a form has no bot check.** a plain fetch of the page cannot see one.
