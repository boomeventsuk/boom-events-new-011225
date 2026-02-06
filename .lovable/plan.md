
# Add 2PM Club Luton Event — May 23, 2026

## Summary
Add a new 2PM Club daytime disco event for Luton on Saturday, May 23, 2026, at The Hat Factory. The event will use the existing `TwoPmClubEventPage` template which automatically routes based on the `-2PM-` slug pattern.

---

## Event Details

| Field | Value |
|-------|-------|
| Event Code | `230526-2PM-LUT` |
| Title | THE 2PM CLUB Luton — 80s 90s 00s Daytime Disco |
| Date | Saturday, 23 May 2026 |
| Time | 14:00 – 18:00 |
| Venue | Hat Factory, Luton |
| Eventbrite ID | 1982497843417 |
| Image | `https://boombastic-events.b-cdn.net/230526-2PM-LUT/230526-2PM-LUT-060626_2PM_NPTON%20ANNSQ.jpg` |

---

## Implementation Steps

### 1. Update `public/events-boombastic.json`
Add a new event entry following the existing 2PM Club format (matching the structure of `070226-2PM-LUT`):
- Standard 2PM Club title, subtitle, description, and fullDescription
- Highlights using the established 5-point emoji format
- ISO 8601 date/time strings for start and end

### 2. Update `public/sitemap.xml`
Add the new event URL for SEO:
```
https://boomevents.co.uk/event/230526-2PM-LUT
```

---

## No Code Changes Required
The routing already handles this automatically:
- `EventTemplate.tsx` detects `-2PM-` in the slug
- Routes to `TwoPmClubEventPage` component
- Renders all sections (Hero, Description, Video, Highlights, Gallery, Testimonials, Checkout, FAQ, Sticky CTA)

---

## Technical Notes
- The event will appear on the homepage Tickets section automatically (sorted by date)
- FOMO badges will work via the existing Notion sync system
- Eventbrite widget will use the provided ID with checkout tracking
