---
name: ux-design
description: >-
  Design or fix an app screen, dashboard, form, settings page, onboarding flow or any page
  people use rather than read, so a stranger gets it at a glance and knows where to tap.
  Use this for "this screen is confusing", "simplify this screen", "make this dashboard
  simpler", "make it easier to use", "nobody finds the button", "redesign the dashboard", "too much on
  one screen", "fix the onboarding", "how should this form work", "make it work on a phone",
  "UX review", or any time a layout has to help someone do something, not just look good.
  For decks, ads and posts use brand-design; for cutting a page's words use caveman-marketing.
compatibility: "No special requirements. Needs a way to see the screen at phone size (a real phone, a browser's device mode or a 390px-wide screenshot) before calling it done. Builds a clickable HTML mockup when the team has no design tool."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# UX design

A screen is not a poster. People come to it to do one thing: check, find, tap, fill in. A
bad screen is rarely ugly. It shows everything at the same size, so nothing tells the eye
where to go, and the one thing the person came for is under a wall of the rest.

## The one rule that governs everything

**Ask what the person came to this screen to do before deciding what goes on it.** One
screen, one job. "See how this week is going" and "edit a post" are two jobs, so they are
two screens, or one screen and a tap.

## Look at it where it is used

Most screens are opened on a phone, in a hurry, with one thumb. Check every screen at
phone width (about 390px) before anything else, then on a laptop. Ask what fits on the
first phone screen without scrolling: that is the whole screen for most people.

## Making or fixing a screen

1. **Write the job in one line.** "The founder opens this to see what shipped and what is
   next." Everything that does not serve that line moves down, behind a tap, or out.
2. **Answer first, at the top.** If the job is a status check, the top is the answer: two
   or three big numbers, or one sentence. Not a heading, a filter bar or an intro.
3. **Then a map, then the detail.** A compact overview the eye takes in at once (a week
   strip, a short list, a progress bar), then the detail for the one item picked. Never the
   detail for every item at once.
4. **One line per item.** Each row is a single short line. The rest opens on tap. Shorten
   the text itself before shrinking the type.
5. **One main action per screen.** It is the biggest, most coloured thing, where the thumb
   reaches. Other actions are smaller and quieter. Two equal buttons is a question the
   person has to answer before doing anything.
6. **Status by colour and word, never colour alone.** A green dot means nothing without
   "Posted" next to it the first time. Use one colour per meaning, everywhere.
7. **Say it in their words.** Labels are what the person would call it, not what the
   database calls it. "Ready to post" beats "status: ready". No internal names, no codes.
8. **Design the empty and broken states.** What the screen says with no data, while
   loading, and when it cannot reach the server. One plain sentence and what to do next.
9. **Two options, one pick.** Make two real layouts, not one and a decoy, and say which you
   would ship and why. Show them as phone screenshots, never as a description.

## Fixing in order

Fix in this order, because each step often solves the next:

1. Cut the words (the caveman-marketing skill does this well).
2. Remove or hide what does not serve the job. Behind a tap, on another screen, or gone.
3. Make the answer the biggest thing on the first phone screen.
4. Turn long rows into one-liners that open on tap.
5. Line everything up to one grid, one margin, one gap.
6. Only then touch colour, type and decoration.

## Hard rules

- **Never hide the thing the person came for behind a tab, menu or scroll.**
- **Never ship a screen you have not seen at phone size.** A desktop screenshot is not a
  check.
- **Tap targets at least 44px.** Small links next to each other are a mis-tap waiting.
- **Readable beats pretty.** If text on a background fails contrast, change the colour.
- **Never invent data to fill a layout.** Use the real data or a marked placeholder.
- **Never remove a feature people use to make a screen cleaner** without saying where it
  went.

## Worked example

The founder: "our team planner is so complicated. i just want to see everything at a
glance."

The audit, handed back first:

```
Team planner, what is wrong (looked at on a phone)

first screen   a 6-item to-do list and nothing else
the week       7 day cards, each a wall of 6 to 9 bullet points
posts          every empty slot gets a full card that says "nothing yet"
every card     "writes: x · posts: y" on every line
the answer     "how is this week going" needs 4 screens of scrolling
```

The fix:

```
two directions attached:
  A  three big numbers on top (launched, to do, days to launch), a 7-day strip,
     then the day you tap
  B  a month grid with coloured dots, the day's detail in a sheet from the bottom
i would ship A: the founder checks this week, not the month, and A answers
it on the first phone screen.

each item is one line, a tap opens the rest. empty slots are one grey line, not cards.
"writes/posts" is gone from the list and lives inside the tap.
```
