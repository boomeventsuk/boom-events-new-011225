

## Add FOOTLOOSE 80s Northampton (September 2026) Event

### Summary
Add a new Footloose 80s event at The Picturedrome, Northampton on Saturday 12 September 2026, 8pm-midnight. This is a clone of the existing Footloose 80s events with a "JUST ANNOUNCED" badge.

### Changes

**1. `public/events-boombastic.json`** — Add new event entry

New event object based on the existing `210326-FL80-NPTON` entry with these specifics:

| Field | Value |
|-------|-------|
| eventCode | `120926-FL80-NPTON` |
| title | FOOTLOOSE 80s Northampton |
| date | Saturday, 12 September 2026 |
| timeDisplay | 20:00 – 00:00 |
| venue | The Picturedrome |
| city | Northampton |
| start | 2026-09-12T20:00:00 |
| end | 2026-09-13T00:00:00 |
| eventbriteId | 1985640928469 |
| image | `https://boombastic-events.b-cdn.net/120926-FL80-NPTON/120926-FL80-NPTON%20ANNSQ.jpg` |
| isSoldOut | false |
| fomoOverride | `{ tier: "on_sale", message: "JUST ANNOUNCED!", timeMessage: null }` |

Standard Footloose 80s description, fullDescription, highlights, soundtrack, and hiddenSections copied from the existing Northampton Footloose event (adjusted to remove sold-out messaging).

**2. `public/sitemap.xml`** — Add URL entry for `/event/120926-FL80-NPTON/`

No other files need changing — the existing `-FL80-` routing in `EventTemplate.tsx` will automatically pick up the new event and render it with the `FootlooseEventPage` template.

