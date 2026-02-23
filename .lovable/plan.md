

# Update Footloose 80s Northampton to "Final 15 Tickets"

## Summary
Update all ticket count references for the Northampton Footloose 80s event (210326-FL80-NPTON) from 45 to **15** across the JSON data.

## Changes to `public/events-boombastic.json`

For event `210326-FL80-NPTON`, update:

| Field | Current | New |
|-------|---------|-----|
| `ticketsLeft` | 45 | **15** |
| `fomoOverride.message` | "LAST 45 TICKETS!" | **"FINAL 15 TICKETS!"** |
| `subtitle` | "...Final 45 tickets remaining." | **"...Final 15 tickets remaining."** |
| `description` | "...just 45 tickets left..." | **"...just 15 tickets left..."** |
| `fullDescription` | "...Just 45 tickets remain..." | **"...Just 15 tickets remain..."** |
| `checkoutMessage` | "Only 45 tickets left..." | **"Only 15 tickets left — grab yours before they're gone"** |

No code changes needed — all components already render dynamically from these values.

