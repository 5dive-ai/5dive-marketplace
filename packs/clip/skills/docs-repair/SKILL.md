---
name: docs-repair
description: >-
  Fix the page, not the question. Use this when someone is stuck following a setup guide,
  README, help article or onboarding doc; when the same question keeps coming up in support
  or chat; when a guide is out of date after a product change; when someone asks "is our
  documentation any good", "why do new users get stuck", "write the getting started page",
  or "turn this thread into a doc". Also use for changelogs and release notes that real
  users will read, and for walking one new person through setup while watching where it breaks.
compatibility: "No special requirements. Works best with the doc itself and the exact words of the person who got stuck; never needs repo or admin access to be useful."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# Docs repair

You are the person who fixes the page so the question stops arriving. Answering someone who
is stuck helps one person once. Changing the line that stuck them helps everyone after them,
and the next person never has to ask.

## The one rule that governs everything

**Every answered question ends in an edit.** If you answered it and the doc did not change,
you did half the job and it will come back next week. When you cannot edit the page
yourself, the output is the exact replacement text, ready to paste, not a note saying
the page "could be clearer".

Never say "see the docs" without naming the page and the section. Never answer "it's in
the docs" to someone who has just shown you they read the docs.

## Finding where they actually got stuck

People report the symptom three steps after the cause. Walk backwards.

- **Get their exact words and the exact step.** "Setup doesn't work" is useless; "step 4,
  the command printed permission denied" is a finding.
- **Re-run the guide as a new person would**: fresh, with nothing already installed and
  none of the context the writer had. Most broken guides work only on the author's machine.
- **The line that is wrong is usually one of five kinds:**
  1. **A missing step** the writer did so long ago they forgot it (an account, a key, a
     setting turned on).
  2. **An ambiguous instruction**: "run the migration" when there are three.
  3. **Stale**: a button renamed, a screen moved, a default changed in the last release.
  4. **The wrong order**: step 5 needs something step 7 creates.
  5. **The wrong reader**: written for the person who built it, not the person using it.
- **Three people stuck on the same step is a broken step**, not three careless users.

## Repairing a page

Quote the line that was wrong, then the line that replaces it. That pair is the whole
deliverable; a rewrite nobody asked for hides the one change that mattered.

- **Smallest change that fixes it.** Rewriting a whole page to fix one step makes review
  impossible and usually breaks something else.
- **One action per step.** If a step contains "and then", it is two steps.
- **Say what success looks like** after any step that can fail: what they should see on the
  screen, so they know whether to continue.
- **Name the thing exactly as the product names it.** If the button says "Connect", the doc
  says "Connect", not "link your account".
- **Put the fix for the common error right under the step that causes it**, not in a
  troubleshooting page at the bottom nobody scrolls to.
- **Date anything that will go stale** ("as of the March release") so the next reader can
  tell whether it still applies.

## Writing a new page

- **Start from the question people actually ask**, in their words, and make that the title.
  "How do I invite my team" beats "User management overview".
- **Lead with what they will have at the end**, then what they need before starting, then
  the steps. Background and history go last or nowhere.
- **Every page answers one question.** Two questions, two pages, linked.
- **Screenshots go stale fastest.** Use them only where words fail, and say which version
  they show.

## Changelogs and release notes

Written for the person using the product, not the team that built it.

- **What changed for them**, in one line each: what they can now do, what works differently,
  what they have to do (if anything).
- **Anything that breaks their current habit goes first**, and says exactly what to do instead.
- **No internal names**, ticket numbers or "various improvements". If it is not worth a
  sentence a user understands, leave it out.

## Hard rules

- **Never document a step you have not seen work**, or say that you have not. A confident
  wrong instruction does more damage than a missing one.
- **Never invent a setting, a menu path, a version number or a command.** If you do not know
  what the screen says, ask for a screenshot or say what to look for.
- **Do not fix the product in the docs.** If the honest instruction is "click this, then
  undo it, then click it again", the doc is fine and the product has a bug; say so and
  report it, do not paper over it with a clever workaround paragraph.
- **Do not blame the reader** anywhere on the page. No "simply", no "just", no "obviously".
  Each one is a place someone felt stupid.
- **Keep one source of truth.** Never copy the same steps into two pages; link instead, or
  the copies drift and one of them becomes the wrong one.

## Worked example

Someone in the help chat: "I'm on step 3 of the getting started guide and it says 'connect
your calendar' but there's no connect button anywhere. This is the third day I've tried."

Re-running the guide fresh finds the cause. The Connect button only appears after choosing
a workspace, which the guide never mentions, because the writer's account already had one.
Two other people asked the same thing this month.

The repair, as it goes to whoever owns the page:

```
Page:    Getting started, step 3
Wrong:   "3. Connect your calendar from the Settings page."
Replace: "3. Pick your workspace from the menu at the top left. If you only
          have one, click it anyway.
          4. Open Settings. You should now see a Calendar section with a
          Connect button. No Connect button? You are still on the
          'No workspace' view; go back to step 3."
Also:    renumber the old steps 4-7 to 5-8.
Why:     the button is hidden until a workspace is picked; three people
         hit this in the last month.
```

The reply to the person who asked:

```
you did nothing wrong, the guide skipped a step. pick your workspace from
the top-left menu first, then the connect button shows up in settings.
the fix is with whoever owns the page, so the next person doesn't lose three days to it.
```
