
# Add THE 2PM CLUB Leicester Event with Leicester Tigers Colour Scheme

## Summary

Add a brand-new 2PM Club event for Leicester at Mattioli Woods Welford Road Stadium (Leicester Tigers' home ground) on Saturday 2 May 2026, 2pm-6pm. Since it's at the Tigers' venue, the page will use a **red and green colour scheme** (Leicester Tigers' brand colours) instead of the default electric blue/pink.

---

## 1. Add Event Data to `public/events-boombastic.json`

New entry with event code `020526-2PM-LEIC`:

- **Title:** THE 2PM CLUB Leicester -- 80s 90s 00s Daytime Disco
- **Venue:** Mattioli Woods Welford Road Stadium, Leicester
- **Date:** Saturday, 2 May 2026, 14:00-18:00
- **Eventbrite ID:** 1983866397800
- **Image:** `https://boombastic-events.b-cdn.net/020526-2PM-LEIC/020526-2PM-LEIC%20no%20badge.jpg`
- **Slug:** `020526-2PM-LEIC`
- **FOMO Override:** "JUST ANNOUNCED!" (new event)
- Standard 2PM Club description, fullDescription, and highlights following the brand pattern
- **New field:** `colorScheme: "leicester"` -- signals this event uses a custom colour palette

## 2. Per-Event Colour Theming (Leicester Tigers Red/Green)

Since there's no existing per-event theming, we need a lightweight mechanism. The approach:

### `src/index.css` -- Add Leicester theme class

Add a `.theme-leicester` class that overrides CSS custom properties:

```text
.theme-leicester {
  --primary: 0 72% 45%;           /* Leicester Tigers Red */
  --secondary: 142 76% 36%;       /* Leicester Tigers Green */
  --accent: 142 76% 36%;          /* Green accent */
  --ring: 0 72% 45%;              /* Red ring */
}
```

This means all `text-primary`, `bg-primary`, `border-primary` elements (CTA buttons, icons, accents, checkout section bg) automatically shift to red/green without touching any component code.

### `src/components/TwoPmClubEventPage.tsx` -- Apply theme class

- Add optional `colorScheme` field to the `TwoPmClubEvent` interface
- When `colorScheme` is set (e.g. `"leicester"`), add `theme-leicester` class to the root wrapper `<div>`
- This scopes the colour override to just this event page

### `src/pages/EventTemplate.tsx` -- Pass `colorScheme` through

- Add `colorScheme` to the `EventData` interface
- Map it through to the `TwoPmClubEvent` object when building the 2PM Club event

## 3. Add "LEIC" to City Code Handling

The `EventTemplate.tsx` already splits event codes to extract city codes. No routing changes needed -- the existing `-2PM-` detection will match `020526-2PM-LEIC` automatically.

## 4. Files Changed

| File | Change |
|------|--------|
| `public/events-boombastic.json` | Add new Leicester event entry with `colorScheme: "leicester"` |
| `src/index.css` | Add `.theme-leicester` CSS custom property overrides |
| `src/components/TwoPmClubEventPage.tsx` | Add `colorScheme` to interface; conditionally apply theme class |
| `src/pages/EventTemplate.tsx` | Add `colorScheme` to `EventData` interface; pass through to 2PM Club mapping |

## 5. What This Looks Like

- CTA buttons: **red** instead of blue
- Calendar/clock/pin icons: **red** accents
- Checkout section background tint: **red/green**
- Highlights section emojis and borders: **red/green**
- Sticky book button: **red**
- Everything else (dark background, white text, layout) stays the same

The copy will use placeholder text for now (standard 2PM Club template wording mentioning Leicester). You mentioned you'll provide the Eventbrite copy once the page is created, at which point we can swap in the final description and fullDescription.
