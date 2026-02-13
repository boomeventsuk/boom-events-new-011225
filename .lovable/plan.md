

# Add FOMO Urgency Copy to Footloose 80s Event Pages

## Summary
Inject ticket urgency into the on-page copy for both Footloose 80s events so visitors feel the scarcity beyond just the badge. This means updating the subtitle, description text, and checkout message to hammer home that tickets are running out.

---

## Changes to `public/events-boombastic.json`

### Footloose 80s Northampton (210326-FL80-NPTON) — LAST 50 TICKETS

| Field | Current | New |
|-------|---------|-----|
| subtitle | "Your favourite 80s night is back!..." | "Your favourite 80s night is back — and it's almost gone. Final 50 tickets remaining." |
| description | Generic one-liner | "FOOTLOOSE 80s Northampton is almost sold out — just 50 tickets left for four hours of non-stop 80s anthems." |
| fullDescription | Standard nostalgic copy (no urgency) | Add a new urgent opening paragraph: "This show is nearly gone. Just 50 tickets remain..." followed by existing nostalgic copy |
| fomoOverride.timeMessage | null | "5 WEEKS TO GO!" |

### Footloose 80s Bedford (280326-FL80-BED) — LAST 30 TICKETS

| Field | Current | New |
|-------|---------|-----|
| subtitle | "Your favourite 80s night is back!..." | "Your favourite 80s night is back — and it's nearly sold out. Final 30 tickets remaining." |
| description | Generic one-liner | "FOOTLOOSE 80s Bedford is nearly sold out — just 30 tickets left for four hours of non-stop 80s anthems." |
| fullDescription | Standard nostalgic copy (no urgency) | Add a new urgent opening paragraph: "Nearly gone. Just 30 tickets left..." followed by existing nostalgic copy |
| fomoOverride.timeMessage | null | "6 WEEKS TO GO!" |

---

## Code Change: Checkout Section Message

### Update `src/components/FootlooseEventPage.tsx`

Currently the checkout message is hardcoded as:
> "Round up your friends and book now. This is your night."

Change this to pull from a new `checkoutMessage` field in the event data, with a fallback. This lets us set urgency-specific checkout copy per event (e.g., "Only 30 tickets left — don't miss your chance to be part of this").

If no `checkoutMessage` is provided in the JSON, it falls back to the existing default.

### New `checkoutMessage` values in the JSON:
- **Northampton:** "Only 50 tickets left — grab yours before they're gone"
- **Bedford:** "Only 30 tickets left — this is nearly sold out"

---

## What the Visitor Sees (Before vs After)

### Hero Section
- Badge already shows "LAST 30/50 TICKETS!" (done)
- Subtitle now reinforces: "...nearly sold out. Final 30 tickets remaining."

### Description Section
- New urgent opening line before the nostalgic copy: "This show is nearly gone..."

### Checkout Section
- Instead of generic "Round up your friends," it now says "Only 30 tickets left — this is nearly sold out"

---

## Technical Details

- Add optional `checkoutMessage` field to `FootlooseEvent` interface in `FootlooseEventPage.tsx`
- Pass it through to `CheckoutSection` component (which already supports a `checkoutMessage` prop)
- All other changes are data-only in the JSON file
- No changes needed to `DescriptionSection.tsx` because it renders `fullDescription` from the JSON directly

