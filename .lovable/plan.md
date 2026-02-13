

# Make Footloose 80s Pages SCREAM Ticket Urgency

Right now the FOMO badge is a small pill in the hero, and the rest of the page carries on as normal. The visitor needs to feel urgency the moment they land and at every scroll point. Here's the plan:

---

## 1. Full-Width Urgency Banner (New Component)

Add a pulsing red/amber banner immediately below the header, before anything else. It sits fixed-width across the page and says something like:

**Bedford:** "LAST 30 TICKETS -- Don't miss out!"
**Northampton:** "LAST 50 TICKETS -- Almost sold out!"

This will be a new `UrgencyBanner` component that takes a message string. It pulses gently to catch attention without being obnoxious. Red background, white bold text, full width.

## 2. Hero Section -- Bigger, Bolder Urgency

- Make the FOMO badge render even without the Supabase data by falling back to the `fomoOverride` data passed from the JSON (tier + message + timeMessage passed as props).
- Change the CTA button text from "BOOK TICKETS" to "GRAB YOUR TICKETS -- ALMOST GONE" when urgency data is present.
- Add a small "selling fast" line under the subtitle reinforcing the ticket count.

## 3. Description Section -- Urgency Opening

The description section is currently fully hardcoded and ignores the `fullDescription` field. Update it to:
- Show a bold, highlighted urgency callout box at the top before the nostalgic copy: a red/amber tinted box saying something like "This event is nearly sold out. Only X tickets remain -- book now before they're gone."
- Pass the ticket count info as a prop so it renders dynamically per event.

## 4. Checkout Section -- Urgent Copy

Already wired up from the last change. The `checkoutMessage` in the JSON will show the urgency copy. No further code changes needed here -- just verify the JSON values are strong enough.

## 5. Sticky Book Button -- Urgency Text

Update the sticky bottom button to show "LAST X TICKETS -- BOOK NOW" instead of just "Book Tickets" when urgency data is present.

---

## Technical Details

### New component: `src/components/footloose/UrgencyBanner.tsx`
- Props: `message: string` (e.g., "LAST 30 TICKETS -- Don't miss out!")
- Full-width red/amber gradient background with `animate-pulse` on the text
- Renders at the very top of `<main>` in `FootlooseEventPage.tsx`

### Changes to `src/components/FootlooseEventPage.tsx`
- Add `ticketsLeft` optional field to `FootlooseEvent` interface
- Render `UrgencyBanner` at top of main when `ticketsLeft` is set
- Pass `ticketsLeft` to `DescriptionSection` and `HeroSection`

### Changes to `src/components/footloose/HeroSection.tsx`
- Accept optional `ticketsLeft` prop
- When present, change CTA button text to "GRAB YOUR TICKETS -- ALMOST GONE"
- Show a secondary urgency line under subtitle: "Only X tickets left!"

### Changes to `src/components/footloose/DescriptionSection.tsx`
- Accept optional `ticketsLeft` prop
- When present, render a prominent urgency callout box above the nostalgic copy

### Changes to `src/components/2pm-club/StickyBookButton.tsx`
- Accept optional `urgencyText` prop
- When present, show it instead of default button text

### Changes to `public/events-boombastic.json`
- Add `"ticketsLeft": 30` to Bedford event (280326-FL80-BED)
- Add `"ticketsLeft": 50` to Northampton event (210326-FL80-NPTON)

### Changes to `src/pages/EventTemplate.tsx`
- Pass `ticketsLeft` through to the `FootlooseEvent` object

This way every section of the page -- banner, hero, description, checkout, sticky button -- all reinforce the same message: tickets are nearly gone, act now.

