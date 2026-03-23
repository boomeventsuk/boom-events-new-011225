

## Update OG Meta Tags for All Event Pages

### Current State
Five of six event page templates already have dynamic OG meta tags via `react-helmet-async`:
- TwoPmClubEventPage — has OG tags
- SilentDiscoEventPage — has OG tags
- FamilySilentDiscoEventPage — has OG tags
- FootlooseEventPage — has OG tags (from code context)
- Boombastic90sEventPage — has OG tags
- GetReadyEventPage — has OG tags
- **EventPageSimple — MISSING OG tags entirely**

For social crawler previews (WhatsApp, Facebook), the Netlify edge function + backend function already serve dynamic OG HTML to bots. This works for all events because it reads from `events-boombastic.json`.

The gap is **EventPageSimple**, which is the fallback template for events that don't match a specific type. It has no `Helmet` import and no OG tags at all.

### Changes

**1. `src/components/EventPageSimple.tsx`** — Add Helmet with dynamic OG tags

- Import `react-helmet-async`
- Add `<Helmet>` block with:
  - `og:title` → event title
  - `og:description` → event description
  - `og:image` → event image
  - `og:url` → canonical URL (`https://boomevents.co.uk/event/{eventCode}`)
  - `og:type` → "event"
  - `og:site_name` → "Boombastic Events"
  - Twitter card tags (summary_large_image)
  - Canonical link
  - Page title and meta description
- Falls back to site-wide defaults from `index.html` if any field is missing (Helmet only overrides what's explicitly set)

This is a single-file change. All other templates and the crawler-side edge functions are already correct.

