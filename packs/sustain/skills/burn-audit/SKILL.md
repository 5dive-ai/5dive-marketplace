---
name: burn-audit
description: >-
  Audit recurring spend line by line and come back with the specific cuts, each with a
  monthly number and a risk note — idle and over-provisioned infrastructure, forgotten
  SaaS seats and subscriptions, a plan tier outgrown in either direction, duplicate tools
  doing one job, and spend that scales with nothing. Use this for "our burn is too high",
  "why is the cloud bill up", "audit our subscriptions", runway pressure, or a
  cost-cutting pass before a budget review.
compatibility: "No special requirements. Works from three months of invoices or a billing export."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# burn-audit

Every finding is a line item, a monthly number, and what breaks if it goes. A cost
review without numbers is an opinion, and an opinion does not survive the meeting where
someone defends the line.

## Procedure

1. **Get the actual bills, not the plan.** Last three months of every invoice: cloud,
   SaaS, contractors, per-seat tools, usage-metered APIs. Three months, because one month
   hides both seasonality and the one-off that will look recurring.
2. **Build the line-item table** — vendor, monthly cost, trend across the three months,
   what it is for, who owns it. Anything nobody can name an owner for is already a
   finding.
3. **Sort by monthly cost, descending, and work top down.** Most burn audits die in the
   weeds of $12 subscriptions while a mis-sized cluster runs untouched at the top.
4. **Classify each line:**
   - **Idle** — provisioned and unused (a stopped-but-billed instance, an unattached
     volume, a seat nobody logged into this quarter).
   - **Over-provisioned** — used, but at a fraction of what is paid for. Needs a
     utilization number, not a guess.
   - **Duplicate** — two vendors covering one job.
   - **Outgrown** — on the wrong tier. This runs in both directions; committed-use or
     annual pricing sometimes cuts a line that pure usage-trimming cannot.
   - **Load-bearing** — real, correctly sized, leave it alone and say so.
5. **Put a monthly number on each cut** and a one-line risk note: what degrades, who
   notices, how fast it is reversible.
6. **Rank by (monthly saving) × (reversibility) ÷ (risk).** Recommend the top few, not
   all of them. A list of 40 cuts gets zero of them executed.
7. **Name the verification step** for each cut — the metric or bill line that proves it
   actually landed next cycle. Unverified cuts reappear.

## Rules

- Never state a saving you did not read off a bill or a documented price. No modeled,
  estimated, or illustrative dollar figures.
- Utilization claims need a measurement. "Probably underused" is not a finding.
- Distinguish **spend that scales with revenue** from **spend that scales with nothing**.
  The second kind is where the real money is; cutting the first kind cuts the business.
- Flag anything with a contractual exit (annual commit, notice period) — the saving does
  not start when you decide, it starts when the term allows.
- Say plainly when a line is correctly sized. An audit that finds everything wasteful is
  not being read carefully.

## Failure modes

- **Bottom-up rabbit hole.** Hours on small subscriptions, minutes on the top line.
- **Counting a one-off as recurring.** A migration month inflates the baseline; use the
  median of the three months, not the peak.
- **Cutting the thing that was load-bearing.** The risk note exists for this; skip it and
  the audit is remembered for the outage, not the savings.
- **No verification.** The cut is announced, the bill does not move, nobody checks.

## Worked example

Illustrative only — the numbers below are the example's input, not a benchmark. Every
figure in a real audit is read off a bill.

Input, three months of invoices for a 9-person company, sorted descending:

```
vendor / line              M1      M2      M3     owner       what for
cloud: k8s node group    4,180   4,240   4,205   platform    prod + staging
cloud: managed postgres  1,090   1,090   1,090   platform    prod db
cloud: idle volumes        310     310     310   nobody      ?
observability vendor       990     990     990   platform    logs + traces
CI vendor                  760     980   1,940   nobody      build minutes
design tool (12 seats)     288     288     288   design      3 designers
CRM (20 seats)             900     900     900   sales       4 in sales
project tool (15 seats)    225     225     225   nobody      whole team
second project tool        180     180     180   nobody      one team
migration consultant     6,000       0       0   cto         one-off, done
```

Findings, top-down, each with a number and a risk note:

```
1. CI vendor, 760 -> 1,940 over 3 months. NOT a tier problem: the trend is the finding.
   Cause must be read before cutting — a retry loop or a test suite that grew. Save:
   unknown until measured. Risk of cutting blind: HIGH (breaks every merge).
   Verify: build-minutes line next invoice.
   >> This is the top of the list despite not being the biggest line, because it is the
      only line that is MOVING. A static 4,180 is a decision; a line that more than doubled is a
      defect.
2. CRM, 20 seats for 4 users = 16 idle seats, 720/mo. Risk: LOW, reversible same day.
   Contractual: annual term, seats reducible only at renewal (Nov) — the saving starts
   in Nov, not this month. Verify: seat count on renewal invoice.
3. Two project tools, 405/mo combined, duplicate. Cut the 180 one, 15 seats already
   cover that team. Risk: MEDIUM — one team's habit, needs a week's notice. Verify:
   vendor cancelled, not just unused.
4. Idle volumes, 310/mo, no owner, unattached. Risk: LOW but snapshot before deleting.
   Verify: line absent next invoice.
5. Design tool, 12 seats for 3 designers. 216/mo. Risk: LOW.
6. k8s node group, 4,205/mo — LOAD-BEARING and correctly sized at 71% mean CPU
   utilization (measured, not assumed). Leave it alone. Do not let the biggest line
   attract a cut just because it is the biggest.
7. Migration consultant 6,000 in M1 only — one-off, NOT recurring. Baseline is the
   3-month median (10,128), not the M1 peak (14,923). Anyone quoting the peak is
   quoting a burn we do not have.
```

Recommended, ranked by saving x reversibility / risk — three, not all seven:

```
now:  idle volumes (310) + design seats (216) + duplicate project tool (180) = 706/mo
      all low risk, all verifiable on next invoice
next: measure the CI trend before touching it. Biggest unknown on the page.
Nov:  CRM seats at renewal (720/mo) — diarise it, or it renews at 20 seats again
```

Note what the audit refused to do: no dollar figure on the CI line, because none was
measured; no cut to the largest line, because utilization said it was right-sized; and
the headline burn number corrected downward from the peak to the median.
