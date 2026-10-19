---
name: clicker-browser-lessons
description: >-
  Browser lessons distilled from real misses: read the saved record back, dismiss email popups, one run per form, never use a site's autofill, list required fields first, each site's login is its own, a bot check can appear mid-flow, only a real render proves there is none, look at the screenshot after submit and write patterns the verbs accept, a thanks-only form is submitted not live, served is not signed in, close Chrome's restore bubble before judging a login, keep a form in one act, leave a honeypot box empty, attach files through the chooser's Open button, check typed text before Enter, never click through a certificate warning, a check after send means not delivered, clear fields a site scraped, verify a new account's email before retrying an invite, re-shoot before clicking by coordinates, check every tick box and dropdown before the final press, a "captcha failed" error after submit is a bot check, read a money form's direction and amount before pressing, an account flagged as automated means stop on that site for the day, have the inbox served before asking for a code, check the page a click landed on before recording from it, decline upsell prompts, a screenshot shows only the first screen so scroll before calling a list empty.
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
21. **re-shoot before you click by coordinates.** a cookie banner, a dialog or a name that wraps to two lines moves everything below it, so coordinates from an earlier screenshot miss.
22. **a tick box or dropdown can miss on the first click.** before the final press, check in a screenshot that every box shows ticked, every dropdown shows its value and the submit button is enabled. a native dropdown that will not open takes a second click or the Down key.
23. **"captcha verification failed" after submit is an invisible bot check.** there was no widget to see, and it is still a hard stop. never press submit twice.
24. **a money form can open on the wrong direction or with an old amount.** read the add/withdraw switch, the amount and the button label in a screenshot before you press.
25. **a site that flags the account as automated means stop there for the day.** after a captcha, a 403 or an "unusual activity" page on a site where you post, tell the owner and do nothing more on that site that day. space later posts hours apart.
26. **a verification link or code can expire within minutes.** have the inbox or chat that receives it served and signed in before you press the button that sends it.
27. **a click can land on a different page than you meant**, like a notification that opens the feed instead of the post. check the URL bar or title before you record a link or id from it. never guess one.
28. **an upsell or "verify your identity" prompt after an action is not the job.** decline it ("Not now"); never start it.
29. **a screenshot shows only the first screen.** before you say a list, feed or inbox has nothing new, or count what is on it, scroll down and shoot again, or say which part you did not reach.
