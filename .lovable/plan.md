

## Mark Silent Disco Greatest Hits 10 as Sold Out

### Summary
Set the Silent Disco event (250426-SD-NPTON) as sold out across the JSON data and add a FOMO override so the homepage card and event page both show "SOLD OUT" badge and "Join Waiting List" CTAs.

### Changes

**1. `public/events-boombastic.json`** — Update the 250426-SD-NPTON entry:
- Set `"isSoldOut": true`
- Add `"badge": "SOLD OUT"`
- Add `"fomoOverride": { "tier": "sold_out", "message": "SOLD OUT" }`

No template code changes needed — the existing SilentDiscoEventPage, EventCard, CheckoutSection, and StickyBookButton components already check `isSoldOut` / `fomoData.is_sold_out` and swap "Book Tickets" to "Join Waiting List" automatically. This is the same pattern used for previously sold-out events.

