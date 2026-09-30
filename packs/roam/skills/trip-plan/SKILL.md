---
name: trip-plan
description: >-
  Turn a rough travel idea into a bookable, walkable itinerary with the boring parts solved,
  then keep it honest about how much a day can actually hold. Use this for "plan me four days
  in X", "is this itinerary too packed", "what order should we do these in", "we have a
  6-hour layover", "where should we stay for this trip", "what do we book now and what can
  wait", family trips with a nap in them, or any request to sequence a trip rather than list
  attractions. Also use to sanity-check a plan someone else already made.
compatibility: "No special requirements. Works from a city and a number of nights. Live prices, opening hours and visa rules must be confirmed at the source before booking."
metadata:
  author: 5dive
  version: "1.0"
  license: company-agnostic
---

# Trip plan

A list of the best things in a city is not a plan. A plan is an order, a set of times, and
an honest statement of what got cut. This skill produces the order and does the cutting.

## The one rule that governs everything

**Plan by geography and opening hours, not by ranking.** Group each day into one walkable
area, then sequence inside it around what is only open at certain times. A day built from
the top five attractions is a day spent in transit between them.

Corollary: **three anchors a day, maximum.** One morning anchor, one afternoon anchor, one
evening thing that requires no energy. Everything else is a maybe, listed as a maybe.

## Build in this order

1. **Fixed points first.** Flights, trains, the wedding, the match, the one restaurant
   with a two-month list, anything closed on a specific day of the week. These are the
   skeleton and nothing else may move them.
2. **Base and moves.** How many bases, and where. Two nights minimum per base, otherwise
   the trip is packing. A move day is a HALF day, both ends, and always costs more than
   the timetable says.
3. **Areas to days.** Assign each day one neighbourhood or one valley. Write the day as
   the area, not the sight.
4. **Anchors into areas**, respecting closing days (this is the classic wrecked day:
   museums shut on a Monday or Tuesday in much of Europe) and the timed-entry slots.
5. **Meals as pins, not as plans.** One booked dinner per day at most. Lunch is where you
   are.
6. **Then subtract.** Remove one anchor per day. The plan is now realistic.

## The judgement calls

- **Transit is the hidden cost.** Door to door, not station to station: allow for the walk
  at both ends, the ticket queue, and the wrong exit. In an unfamiliar city, double your
  first estimate of the first day.
- **Timed entry changes the shape of the day.** One 09:00 slot fixes the entire morning
  around it. Book the timed thing first, then build outward.
- **Jet lag is a real line item.** Arriving east across many hours, the first afternoon is
  a walk and an early dinner, never the big museum ticket.
- **Book now vs later.** Book now: flights, the first night, timed entries, anything with
  a hard cap (a permit, a ferry, a famous restaurant), anything in high season. Book later:
  most restaurants, day trips, everything weather-dependent.
- **Weather-dependent things need a swap, not a hope.** For every outdoor anchor, name the
  indoor thing that takes its slot.
- **Someone in the group has a different day.** A toddler nap, a knee, a fast, a curfew,
  a fear of heights. Ask early. It changes the base choice, not just the schedule.
- **Cash, plug, ticket, data.** Every trip has four boring unlocks. Name them once, at the
  top, so nobody solves them at a barrier.
- **Never assert a price, an opening time, or a visa rule as fact.** Say what to check and
  where. Rules change and a confident wrong number ruins a border crossing.

## What to hand back

- The skeleton (fixed points, bases, move days) before any sightseeing.
- Day by day: area, morning anchor, afternoon anchor, low-energy evening, one maybe, one
  wet-weather swap.
- A short book-now list with a reason per line.
- The cut list, visible. What did not fit and what it would cost to fit it.

## Worked example

```
in: 4 nights in Kyoto, arriving from London, two adults, one is a slow walker,
    late October, want temples and food, do not want to be on a bus all day

fixed points
  arrive 15:40 day 1 (Kansai, then ~75-100 min to the city, so day 1 is gone)
  depart mid-morning day 5 -> day 5 is breakfast and a station, nothing more
  check: any temple on the list closed on a weekday, and the exact autumn
         illumination dates, which move every year (source: the temple's own
         page, not a blog)

bases
  one base, 4 nights, near Karasuma-Oike or Kyoto Station.
  reason: with a slow walker, subway access beats being cute and remote.
  no second base. Nara and Osaka stay day trips or get cut.

days by AREA, not by sight
  day 1  arrival. one neighbourhood walk near the hotel, konbini water, early
         dinner booked before landing, in bed by 21:00. no ticket, no shrine.
  day 2  Higashiyama, south to north. gets the earliest start of the trip
         because it is the one that fills with people by 09:30.
           morning   : the big hillside temple at opening
           afternoon : the lanes north, at a wander, one garden with a bench
           evening   : nothing. a bowl of noodles near the hotel.
           maybe     : one more temple, only if the knee is fine
           wet swap  : the covered market plus a department-store food floor
  day 3  Arashiyama, then the north-west.
           morning   : bamboo grove EARLY, it is a photograph not an afternoon
           afternoon : the moss garden or the villa garden, one, not both
           evening   : river walk, seated dinner, no reservations needed
           wet swap  : a crafts museum and a long coffee
  day 4  central and Fushimi.
           morning   : the shrine gates, going up only as far as the first
                       viewpoint, which is where the crowd thins and the
                       stairs stop being kind
           afternoon : Nishiki market, kitchen street, one department store
           evening   : the booked dinner of the trip
           maybe     : Nara. only if day 2 felt easy. see cut list.
  day 5  breakfast, station.

book now
  flights, all 4 nights (late October is peak), the day-4 dinner, the seat
  reservation for the airport train home.
book later
  everything else. day trips and gardens stay weather-dependent.

boring unlocks
  transport card, an eSIM or pocket wifi, cash for small temples and markets,
  a plug adapter, and one printed copy of the hotel address in Japanese.

CUT, and said out loud
  Nara: a full day, one long train each way, deer. taking it means losing the
        Fushimi morning or the market afternoon.
  Osaka evening: 2 hours of travel to eat, on a knee that already did Higashiyama.
  the second moss garden: it is the same feeling twice at two ticket prices.
```

## Traps

- **The list-of-nine-temples day.** It reads impressive and delivers three temples and a
  bad mood.
- **Cross-city dinner reservations.** A 19:30 table on the other side of town deletes the
  afternoon.
- **Last-day sightseeing.** Anything on a departure morning is a bag, a queue, and stress.
- **Ignoring closing days.** One unchecked Monday can void a day's whole plan.
- **Quoting a live number.** Fares, hours, entry fees and entry rules are for the source,
  today, not for this plan's memory.
- **Planning around the best weather instead of the likely weather.** Name the swap.
