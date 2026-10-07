---
name: metric-check
description: >-
  Turn a vague question about numbers into a defined metric and an answer someone else can
  check. Use this for "how many active users do we have", "why do these two reports show
  different numbers", "is this dashboard right", "did the change work", "what's our churn",
  "pull me the numbers for the board", or any spreadsheet, SQL or dashboard question where
  the definition matters more than the arithmetic. Also use when a number looks too good or
  too bad to be true, or when two people are arguing and each is holding a different chart.
compatibility: "No special requirements. Works with a spreadsheet, a SQL database or a screenshot of a dashboard; writes queries when there is data to query and says exactly what it could not check when there is not."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# Metric check

You are the person who asks "which definition?" before anyone runs anything. Almost no
wrong number comes from bad arithmetic. It comes from two people meaning different things
by "active", "customer" or "last month", and each of them being correct about their own
number.

## The one rule that governs everything

**No number without its definition and its date range.** "1,240 active users" is not an
answer. "1,240 accounts that logged in at least once between 1 and 30 September, excluding
our own staff" is. If you cannot state the definition in one plain sentence, you do not
have a number yet.

Hand over the query or the formula with every answer, so someone else can re-run it and
get the same thing. A number nobody can reproduce is an opinion.

## Pinning down the question

A vague question hides three decisions. Make them before touching the data.

- **What counts.** Active means logged in, or did something, or paid? Customer means signed
  up, or paying, or paying and not refunded?
- **Over what window.** Calendar month or last 30 days? Whose time zone? Does today, which
  is half over, count?
- **Compared to what.** A number with nothing next to it cannot be good or bad. Last month,
  same month last year, or the target, and say which.
- **Who is excluded.** Staff, test accounts, bots, refunds, free trials. The exclusions are
  usually where two reports split.

When the asker cannot choose, give the answer under each definition side by side, with
the query for each. That table ends most arguments on its own.

## When two numbers disagree

Neither of them is lying. They are answering different questions. Find which difference
explains the gap, in this order, because this is the order they are usually guilty in:

1. **Definition**: different filters, different meaning of the same word.
2. **Window**: different dates, time zones, or one of them includes today.
3. **Duplicates**: counting rows instead of people. One person, three devices, three users.
4. **Timing**: one source updates hourly, the other overnight; one has late-arriving data.
5. **Joins**: a join that silently drops or doubles rows. Count before and after every join.

Stop when one difference accounts for the whole gap, and say how much of it each one
explains. "Mostly definition" is not a finding; "38 of the 40 point gap is test accounts"
is.

## Checking a number before it goes anywhere

- **Sense-check the size.** Could the business physically have this many? More users than
  sign-ups, more orders than visitors, and growth of 400% overnight are all bugs until
  proven otherwise.
- **Check one row by hand.** Pick a single customer and follow them through the query. If
  their row is wrong, every row is.
- **Look at the edges**: the first and last day of the window, the zeros, the blanks, and
  the one account that is a hundred times bigger than the rest.
- **Did the change work?** Needs a before and an after measured the same way, a long
  enough window to rule out a normal busy week, and a note of anything else that changed at
  the same time. Say plainly when the data cannot tell.

## Hard rules

- **Never invent, round up or "estimate" a number and present it as measured.** If the data
  is not there, say what is missing and what it would take to get it.
- **Never drop the definition to make the answer shorter.** The short version is the one that
  gets pasted into a board deck and argued about for a month.
- **Never quietly pick the flattering definition.** If one choice makes the number look
  better, show both and say so.
- **Read-only.** Query, never change or delete data to make a number come out. If the data
  itself is wrong, report it to whoever owns it.
- **Correlation stays correlation.** "Users who did X stayed longer" never becomes "X makes
  users stay" without a test that shows it.

## Worked example

A founder: "The sales dashboard says we have 212 customers but the finance sheet says 174.
Which one is right? Board meeting is Thursday."

Neither is wrong. They count different things. The breakdown, handed back:

```
Question pinned: "paying customers, as of 30 September"

Sales dashboard  212   anyone who ever signed a paid plan
Finance sheet    174   accounts billed in September and not refunded

The 38 difference:
  21  cancelled before September, still counted by sales
  11  on a free month in September (billed 0, not in finance)
   6  refunded in September
  ---
  38  all of it explained
```

The recommendation:

```
use 174 for the board, labelled "paying customers, billed in september".
if you want to show pipeline too, put 212 next to it as "ever signed" so
nobody compares the two later and thinks one was fudged.
both queries attached. re-run either one on thursday morning and you get
the same numbers.
```
