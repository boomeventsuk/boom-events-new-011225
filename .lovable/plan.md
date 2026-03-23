

## Add BOOMBASTIC 90s Northampton + Remove FL80 Error

### Summary
Replace the erroneously added Footloose 80s event (120926-FL80-NPTON) with a new Boombastic 90s event at The Picturedrome, Northampton on Saturday 12 September 2026, 8:30pm-12:30am. Create a new Boombastic 90s template using the same layout structure as Footloose.

### Changes

**1. `public/events-boombastic.json`** — Replace FL80 entry with B90

Remove the `120926-FL80-NPTON` event object. Add new entry:

| Field | Value |
|-------|-------|
| eventCode | `120926-B90-NPTON` |
| title | BOOMBASTIC 90s Northampton |
| subtitle | All of the Nineties. Every Last Bit of It. |
| date | Saturday, 12 September 2026 |
| timeDisplay | 20:30 – 00:30 |
| venue | The Picturedrome |
| city | Northampton |
| start | 2026-09-12T20:30:00 |
| end | 2026-09-13T00:30:00 |
| eventbriteId | 1985640928469 |
| image | `https://boombastic-events.b-cdn.net/120926-B90S-NPTON/120926-B90S-NPTON-SQ.jpg` |
| isSoldOut | false |
| description | From the Eventbrite copy provided |
| fullDescription | From the Eventbrite copy provided |
| highlights | 4 highlights from the copy |
| soundtrack | Spice Girls · Oasis · Take That · TLC · Blur · Pulp · Faithless · N-Trance · Peter Andre · S Club 7 · Robin S · Britney Spears · Backstreet Boys · No Doubt · Steps · Jamiroquai · Fatboy Slim · CeCe Peniston · MC Hammer · Supergrass · Five · Will Smith |
| fomoOverride | `{ tier: "on_sale", message: "JUST ANNOUNCED!", timeMessage: null }` |

**2. Create Boombastic 90s template components** (same layout as Footloose)

- `src/components/Boombastic90sEventPage.tsx` — Main page component (clone of FootlooseEventPage with "BOOMBASTIC 90s" branding, `DanceEvent` schema)
- `src/components/boombastic-90s/HeroSection.tsx` — Reuse footloose HeroSection structure
- `src/components/boombastic-90s/DescriptionSection.tsx` — 90s-specific nostalgia copy from Eventbrite text
- `src/components/boombastic-90s/SoundtrackSection.tsx` — Same layout, 90s heading
- `src/components/boombastic-90s/HighlightsSection.tsx` — Reuse shared highlights component
- `src/components/boombastic-90s/TestimonialsSection.tsx` — 90s-specific testimonial
- `src/components/boombastic-90s/FaqSection.tsx` — 90s-adapted FAQ answers

**3. `src/pages/EventTemplate.tsx`** — Add `-B90-` routing

Add detection for `-B90-` in eventCode and route to `Boombastic90sEventPage` template, mapping fields like the existing Footloose pattern.

**4. `public/sitemap.xml`** — Replace FL80 URL with B90 URL

Replace `/event/120926-FL80-NPTON/` with `/event/120926-B90-NPTON/`

### Technical Detail

The new template reuses the Footloose layout structure (Hero → Description → Soundtrack → Highlights → Testimonials → Checkout → FAQ → StickyBookButton) but with all copy, colours, and branding adapted for Boombastic 90s. The `EventTemplate.tsx` router will detect `-B90-` in the slug and render the correct template.

