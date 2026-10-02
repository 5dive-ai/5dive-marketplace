---
name: form-filling
description: >-
  Checklist for filling and submitting a web form in the browser: a listing,
  a signup, a supplier or vendor form, a directory submission, a contact or
  support form. Use before the first field is typed, and again after submit.
  Covers required fields and assets, pre-filled forms, email popups, autofill
  and AI-assist buttons, bot checks and reading the saved record back.
---

# form-filling

A form is where browser jobs go quietly wrong: the page says "success" and the
record is wrong. Work this list in order.

## Before you type
1. **Read the whole form first.** Snapshot it, scroll to the bottom, open any
   collapsed sections. List every required field and every asset it asks for
   (logo, screenshots, description, category, links).
2. **Check you have all of it.** If anything required is missing from the job
   you were given, stop now and ask for it. Do not fill half and hope.
3. **Is it the right account?** If the form needs a login, it is that site's
   own login. "Sign in with Google" on a new site still needs the human to
   connect that site (the **connect-site** skill). Never type a password.

## While you fill
4. **One run, every field.** Fill the whole form in a single run. Browser tabs
   keep page state between runs, so a form you left half-done comes back
   half-done.
5. **Clear a pre-filled form.** If fields already hold text, from an earlier
   run or the site's own guess, clear them and re-check before you type.
6. **Never press autofill or AI-assist.** A site's "generate description" or
   "autofill from URL" button writes text you were not given. Type only what
   the job gave you.
7. **An email popup is not the form.** A newsletter or "get updates" box that
   pops up mid-fill gets dismissed. Never type into it.
8. **A bot check is a hard stop, wherever it appears.** CAPTCHAs and "verify
   you are human" pages can show up after a sign-in or submit button, not only
   on page load. Say what the page shows, attach a screenshot, ask for a
   person. Only a real browser render shows whether a form has one; a plain
   fetch of the page cannot.

## After submit
9. **Read the saved record back.** Open the listing, profile or confirmation
   the site saved and check every field landed where you meant, word for
   word. A URL in the name field still says "success". A form that only says
   "thanks" (Tally and the like) leaves no record to read: report
   "submitted, not live".
10. **Leave the receipt.** What you submitted, the page's own confirmation
    words, the time, and a link to the saved record.
11. **Log the miss.** If anything above went wrong, write it down as a lesson
    with **compile-knowledge**: the date, the site, what happened, the lesson,
    and whether it applies to every site or just this one.
