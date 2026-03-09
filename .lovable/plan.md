

# Revamp Jobs Page: Add DJ Role with Collapsible Cards + Header Link

## Summary

Restructure the `/jobs` page to support two job listings (DJ role first, Event Assistant second) using collapsible/accordion cards that expand on click. Add a "Jobs" link to the site header navigation.

## Changes

### 1. `src/pages/Jobs.tsx` -- Major restructure

- Define an array of job listings, each with title, subtitle, and content sections
- **Job 1 (DJ):** "DJ - Boombastic Events" with the provided copy, CTA links to a Typeform/video questions link (or mailto for now)
- **Job 2 (Event Assistant):** The existing content, reorganised into the same structure
- Use Radix `Collapsible` (already installed) or `Accordion` for expand/collapse behaviour
- Each role card shows: role title, pay/location summary, and a "View Details" toggle
- On click, the card smoothly expands to reveal the full description sections
- Both default to collapsed so the page looks clean with two cards stacked
- Keep the hero image, photo gallery, and video section below both listings
- Primary CTA for DJ role: "Get In Touch" (mailto or a link you provide later)
- Primary CTA for Event Assistant: existing mailto link

Visual structure:
```text
┌─────────────────────────────┐
│  WORK WITH US               │
│  Subheadline + hero image   │
├─────────────────────────────┤
│ ▸ DJ - Boombastic Events    │  ← click to expand
│   Rate TBC | Weekends | ... │
├─────────────────────────────┤
│ ▸ Event Assistant            │  ← click to expand
│   £15/hour | Weekends | ... │
├─────────────────────────────┤
│  Photo Gallery               │
│  Video Section               │
│  Final CTA                   │
└─────────────────────────────┘
```

### 2. `src/components/Header.tsx` -- Add Jobs nav link

- Add a "Jobs" link to the desktop nav (as an `<a href="/jobs">`) after "About"
- Add the same to the mobile menu

### 3. Files Changed

| File | Change |
|------|--------|
| `src/pages/Jobs.tsx` | Restructure into accordion-style dual job listings with DJ role first |
| `src/components/Header.tsx` | Add "Jobs" link to desktop and mobile navigation |

