---
name: clicker-browser-lessons
description: >-
  Browser lessons distilled from real misses: read the saved record back, dismiss email popups, one run per form, never use a site's autofill, list required fields first, each site's login is its own, a bot check can appear mid-flow, only a real render proves there is none, look at the screenshot after submit and write patterns the verbs accept, a thanks-only form is submitted not live, served is not signed in, close Chrome's restore bubble before judging a login, keep a form in one act, leave a honeypot box empty, attach files through the chooser's Open button, check typed text before Enter, never click through a certificate warning, a check after send means not delivered, clear fields a site scraped, verify a new account's email before retrying an invite.
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
9. **look at the screenshot after a submit**, not only the exit code. a success line can show for a moment and the form reset under it. `--expect` already ignores case, so never put `(?i)` in it; in a `wait_for` step use `text=/word/i`.
10. **a form that only says "thanks" leaves no record to read back** (Tally and the like). report "submitted, not live", never "live".
11. **served is not signed in.** a running browser can hold an expired session. check `5dive browser status <site>` reads authenticated before you start a job that needs the login.
12. **input mode: Chrome's "Restore pages?" bubble can hide the sign-in link or avatar.** close it and take a new screenshot before you judge signed in or out, and check the URL bar shows the page you meant.
13. **each act that opens a URL starts the page fresh.** a filled form, an open dialog or a code box from one act is gone in the next. fill and submit in one act. when a later step needs the same page (a code that arrives after "Send code"), keep the browser served and act without a URL, and test that before you spend a press you only get once.
14. **a blank, unlabelled text box in a form is usually a honeypot.** leave it empty.
15. **attaching a file: in the file chooser type the full path, then click Open.** Enter alone can close the chooser with nothing attached. check the file name shows on the form before you submit. if the form also takes an image URL, use that instead.
16. **check typed text in the screenshot before you press Enter.** a field can refuse focus or drop characters. after two misses on the same field, try one other way in, then stop. never send a partial message.
17. **a certificate warning is a hard stop.** never click through it. the same site with or without `www.` can have a valid certificate; try that once.
18. **a check that appears after you send means it was not delivered.** a chat or relay bot can let the first command through and hold the first real message behind a captcha. report "not delivered".
19. **a site that fills the form by reading your URL writes text you were not given.** clear every field you have no value for. if the form has no place for text you were given, stop and ask; never rewrite it to fit.
20. **an invite refused for a new account is usually an unverified email.** verify the account's email, then retry the invite once.
