---
name: pitch-teardown
description: >-
  Attack a pitch deck or fundraising narrative the way an investor reads it — nine seconds
  on the problem slide, then the number. Finds the slide that carries no argument, forces
  the claim that has no evidence behind it into either a source or a cut, and rewrites the
  narrative into one spine a reader can repeat. Use for "review my deck", "is this pitch
  ready", seed/Series-A narrative work, investor updates, a data-room memo, or a rehearsal
  pass before a partner meeting.
---

# pitch-teardown

A deck is an argument with pictures. Most decks are a tour of the company instead, and the
tour is why the meeting ends with "keep us posted". This skill builds or repairs the
argument, then tries to break it before someone with money does.

Not copywriting (that is voice and polish), not research (that is where the market numbers
come from). This is the structural pass: does the argument hold, and does every slide earn
its place in it.

## Procedure

1. **Get the spine before you touch a slide.** One sentence: who is bleeding, how much, how
   often, and why the fix only works now. If the spine takes a paragraph, there is no spine
   yet and every slide downstream is decoration.
2. **Read the deck in the reader's order and time it.** Problem slide first, nine seconds.
   Write down what you understood. If that does not match the spine, the deck is not making
   the argument its author thinks it is.
3. **Slide-by-slide, ask one question: what does this slide prove?** Every slide is a claim
   plus its evidence, or it is a cut. Three states, mark each one:
   - **Load-bearing** — the argument breaks without it.
   - **Support** — it strengthens a load-bearing slide. It goes in the appendix.
   - **Tour** — it describes the company. Cut it.
4. **Separate the claims from the evidence.** List every number, logo, and comparison, and
   next to each: where it came from. Anything sourced to "we think" gets sourced properly or
   gets softened into what it actually is.
5. **Make them say the number out loud before the story.** Revenue, growth rate, retention,
   pipeline, burn, runway. Whichever ones exist. A narrative built to avoid a number is
   audible, and the question comes anyway, just later and worse.
6. **Cut the deck to its spine, then read it cold.** Load-bearing slides only, in order.
   If it still argues, the appendix can come back. If it stops arguing, you cut a
   load-bearing slide and mislabeled it.
7. **Run the objection pass.** Write the three hardest questions a skeptic asks — usually
   the market size derivation, why now, and why this team. Answer each in one line. If an
   answer needs a slide, that slide was missing.
8. **Rehearse against the clock.** Time to the spine, time to the number, time to the ask.
   Every second before the first number is a second the reader spends deciding whether to
   keep reading.

## Rules

- One argument per slide. Two arguments is two slides or one cut.
- Never invent, model, or round a number into something better than the source says. A
  fabricated metric in a deck is not a copy problem, it is a diligence problem, and it is
  found.
- Kill "seamless", "game-changing", "next-generation", "disrupting". They
  are the words a deck reaches for exactly where the evidence is missing, which is why a
  reader treats them as a signal of it.
- Comparisons name the comparison. "10x faster" needs the baseline, the workload, and who
  measured.
- Derive market size bottom-up from a unit and a price, and show the arithmetic. A cited top-down number is read as a number the author did not check.
- The ask is specific: amount, what it buys, what milestone it reaches. "Raising to grow"
  is not an ask.
- Say plainly which slides are already good. A teardown that finds everything broken is not
  being read carefully, and it gets ignored wholesale.

## Failure modes

- **Polishing the tour.** Every slide gets tighter and the deck still makes no argument.
  Structure first, language second, always in that order.
- **Burying the number.** The number moves back one slide at a time until it is on slide 14
  next to the team photo. Notice when a rewrite makes the number later.
- **Appendix as a hiding place.** Support material is fine in the appendix; a load-bearing
  slide moved there because it invites a hard question is a hole in the argument.
- **Optimizing for the author's favorite slide.** It is usually the product deep-dive, and
  it is usually support.
- **Rewriting the objections instead of answering them.** If the honest answer to "why now"
  is weak, the fix is a different argument. A better sentence will not save it.

## Worked example

Input: an 18-slide seed deck (illustrative). Spine, as extracted in step 1, took the
founder four sentences — which is the first finding.

Slide-by-slide pass, three states:

```
 1 title                                        SUPPORT (fine, 3 seconds)
 2 "the future of work is changing"             TOUR -> CUT
 3 team bios, 6 people, photos                  SUPPORT -> appendix (slide 14 does this
                                                  better with the one relevant credential)
 4 problem: "ops teams are drowning"            LOAD-BEARING but unproven, see below
 5 market: "$47B TAM (Gartner)"                 CLAIM WITHOUT DERIVATION -> rebuild
 6 product screenshot                           LOAD-BEARING
 7 product screenshot                           SUPPORT -> appendix
 8 product screenshot                           TOUR -> CUT
 9 "seamless, next-generation platform"         TOUR -> CUT (and the words go)
10 how it works, 3 boxes and arrows             LOAD-BEARING
11 competitor grid, us with all the checkmarks  CUT — nobody has ever believed one
12 traction: 14 pilots, 3 paying, $4.2k MRR     LOAD-BEARING, and it is buried at 12
13 logos of the 14 pilots                       SUPPORT (2 are unsigned LOIs -> label)
14 "why us": the ops-lead credential            LOAD-BEARING (fold slide 3 into this)
15 roadmap, 4 quarters                          SUPPORT -> appendix
16 "raising $2M to grow the team"               NOT AN ASK -> rebuild
17 vision slide                                 TOUR -> CUT
18 thanks                                       fine
```

Findings, in the order that changes the deck:

```
1. THE NUMBER IS ON SLIDE 12 AND IT IS THE STRONGEST THING IN THE DECK. 3 paying
   customers and $4.2k MRR at seed is evidence; eleven slides of narrative before it
   reads as a deck avoiding a number, and the reader forms that view by slide 5.
   Move traction to 3. Time-to-first-number goes from ~6 min to ~40 sec.
2. MARKET SIZE: "$47B (Gartner)" is a cited top-down number, which reads as a number
   the author did not check. Derive it bottom-up: ops teams in the segment x seats x
   price, arithmetic shown. A defensible $310M beats an unbelievable $47B, because the
   reader is not evaluating the size, they are evaluating whether you did the work.
3. PROBLEM SLIDE PROVES NOTHING. "Ops teams are drowning" is the spine's premise stated
   as a fact. It needs one of: the pilot's own before/after, hours per week measured, or
   a customer sentence in quotes. You have 14 pilots — the evidence exists, it is just
   not on the slide.
4. THE ASK IS NOT AN ASK. "$2M to grow the team" -> "$2M for 18 months: 4 engineers and
   one ops hire, to reach $50k MRR and 20 paying customers." Amount, what it buys,
   what milestone it reaches.
5. FOUR-SENTENCE SPINE. If it does not fit in one sentence, the deck cannot either.
   Draft: "Ops teams lose a day a week to manual handoffs; we automate them; 3 of our
   14 pilots already pay for it."
6. LABEL THE TWO UNSIGNED LOIs on slide 13. An unlabeled LOI logo beside paying-customer
   logos is the kind of thing diligence finds, and then it is not a design question.

ALREADY GOOD, LEAVE ALONE: slide 10 (how it works — three boxes, no jargon, a reader
gets it in 9 seconds) and the ops-lead credential on 14, which is the single most
convincing sentence in the file.
```

Cut to spine: 18 slides -> 9, with 6 in an appendix. Read cold, it still argues, which
is the check that nothing load-bearing was cut by mistake.

Note the two things the teardown refused to do: it did not invent a better market number
to replace the bad one (it prescribed the derivation instead), and it named two slides as
already good. A teardown that finds everything broken gets ignored wholesale.
