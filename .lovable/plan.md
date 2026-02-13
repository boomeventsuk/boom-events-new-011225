

# Update Ticket Counts to Feel Like a Live Countdown

## Summary
Change the ticket numbers to more specific, "odd" counts that feel like they're counting down in real-time rather than round numbers.

## Changes to `public/events-boombastic.json`

### Footloose 80s Bedford (280326-FL80-BED)
- `ticketsLeft`: 30 → **27**
- `fomoOverride.message`: "LAST 30 TICKETS!" → **"LAST 27 TICKETS!"**
- `description`: update "30 tickets" references → **"27 tickets"**
- `subtitle`: update "30 tickets" → **"27 tickets"**
- `checkoutMessage`: "Only 30 tickets left" → **"Only 27 tickets left — this is nearly sold out"**

### Footloose 80s Northampton (210326-FL80-NPTON)
- `ticketsLeft`: 50 → **45**
- `fomoOverride.message`: "LAST 50 TICKETS!" → **"LAST 45 TICKETS!"**
- `description`: update "50 tickets" references → **"45 tickets"**
- `subtitle`: update "50 tickets" → **"45 tickets"**
- `checkoutMessage`: "Only 50 tickets left" → **"Only 45 tickets left — grab yours before they're gone"**

## No code changes needed
All updates are data-only. The components already pull `ticketsLeft` and `fomoOverride.message` dynamically, so the banner, hero, description callout, and sticky button will all automatically reflect the new numbers.

