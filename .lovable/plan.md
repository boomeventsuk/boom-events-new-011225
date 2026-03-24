

## Revamp Header and Footer Navigation

### Summary
Replace the current scroll-based nav with proper dropdown menus for "Our Parties" and "Locations", clean up redundancy (remove duplicate "Tickets"/"Book Tickets"), and restructure the Footer with link columns. All links use `<a href>` for static HTML pages.

### Header Changes (`src/components/Header.tsx`)

**Desktop nav** (inside `.primary-nav`):
- **Our Parties** — hover dropdown with 6 links:
  - BOOMBASTIC 90s -> `/boombastic-90s/`
  - Silent Disco Greatest Hits -> `/silent-disco/`
  - FOOTLOOSE 80s -> `/footloose-80s/`
  - GET READY -> `/get-ready/`
  - Family Silent Disco -> `/family-silent-disco/`
  - THE 2PM CLUB -> `https://www.the2pmclub.co.uk` (external, opens new tab)
- **Locations** — hover dropdown with 6 links:
  - Northampton -> `/locations/northampton/`
  - Bedford -> `/locations/bedford/`
  - Milton Keynes -> `/locations/milton-keynes/`
  - Coventry -> `/locations/coventry/`
  - Luton -> `/locations/luton/`
  - Leicester -> `/locations/leicester/`
- Keep: **Reviews** (scroll), **About** (scroll), **Jobs** (`/jobs`)
- Remove: "Tickets" button (redundant with "Book Tickets" CTA)
- "Book Tickets" CTA button stays, scrolls to `#tickets`

**Dropdowns implementation**: Pure CSS hover dropdowns using relative/absolute positioning. Styled to match the dark theme (`bg-popover`, `border-border`, rounded corners). Each dropdown item styled with `font-poppins text-muted-foreground hover:text-primary`. No external library needed.

**Mobile menu**: Replace flat link list with accordion-style sections:
- "Our Parties" heading -> toggles list of 6 party links
- "Locations" heading -> toggles list of 6 location links
- Reviews, About, Jobs as flat links
- Social links at bottom
- Use React state for accordion open/close

### Footer Changes (`src/components/Footer.tsx`)

Replace single-column centered layout with a multi-column grid:
- **Column 1**: Logo + email + social icons (existing content)
- **Column 2**: "Our Parties" heading + 6 party links
- **Column 3**: "Locations" heading + 6 location links
- **Column 4**: "Company" heading with About (`/about/`), Jobs (`/jobs`), Privacy, Terms

All links use `<a href>`. Remove `react-router-dom` Link imports.

Copyright line spans full width below columns.

### CSS Changes (`src/index.css`)

Add styles for:
- `.nav-dropdown` — the hover dropdown container (absolute positioned, dark bg, rounded, shadow)
- `.nav-dropdown-item` — individual dropdown links
- `.mobile-accordion` — collapsible sections in mobile menu
- Update `.primary-nav` gap to accommodate dropdown triggers

### Technical Detail

Dropdowns are CSS-only on desktop (`:hover` on parent `<div>` shows child `<div>`). No Radix or external dropdown library needed — keeps it lightweight and matches the existing pattern of inline styles in `index.html`. Mobile accordion uses simple React `useState` toggles.

