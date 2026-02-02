

## Plan: Create "Work With Us" Jobs Page

### Overview

Create a new `/jobs` page that matches the existing site styling (dark background, Poppins/Bebas typography, card sections with borders) and add a link to it in the Footer.

---

### Files to Create/Update

| File | Action |
|------|--------|
| `src/pages/Jobs.tsx` | **Create** - New jobs page component |
| `src/App.tsx` | **Update** - Add route for `/jobs` |
| `src/components/Footer.tsx` | **Update** - Add "Work With Us" link |
| `public/sitemap.xml` | **Update** - Add jobs page URL |

---

### 1. Create Jobs Page (`src/pages/Jobs.tsx`)

Following the Privacy page pattern with:
- Back navigation link to homepage
- Hero section with headline and subheadline
- Card-style content sections with dark backgrounds and borders
- CTA button at the bottom

**Structure:**
```text
+------------------------------------------+
|  ← Back to Events                        |
+------------------------------------------+
|                                          |
|         WORK WITH US                     |
|  Be part of the Midlands' favourite      |
|         daytime disco.                   |
|                                          |
+------------------------------------------+
|  [Card: Event Assistant role]            |
|  - £15/hour | Weekends                   |
|  - What you'll do section                |
|  - Who we're looking for section         |
|  - Availability info                     |
|  - "This isn't for everyone" section     |
+------------------------------------------+
|                                          |
|    [Get In Touch Button]                 |
|    mailto:hello@boomevents.co.uk         |
|    ?subject=Event%20Assistant%20Role     |
|                                          |
+------------------------------------------+
```

**Styling:**
- Dark gradient background (`bg-gradient-to-br from-background via-background to-primary/5`)
- Bebas font for headings (`font-bebas`)
- Poppins font for body text (`font-poppins`)
- Card sections with `bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border`
- Primary colour accents for highlights

---

### 2. Update App.tsx

Add the new route before the catch-all:
```tsx
import Jobs from "./pages/Jobs";
// ...
<Route path="/jobs" element={<Jobs />} />
```

---

### 3. Update Footer

Add "Work With Us" link to the Legal Links section:
```tsx
<Link to="/jobs" className="...">Work With Us</Link>
<span className="text-muted-foreground">|</span>
```

---

### 4. Update Sitemap

Add the new page URL:
```xml
<url><loc>https://boomevents.co.uk/jobs/</loc></url>
```

---

### Content Sections

The job listing will be broken into clear, scannable sections:

1. **Role Header** - "Event Assistant | £15/hour | Weekends"
2. **Introduction** - Brief overview paragraph
3. **What You'll Do** - Bullet points or structured list
4. **Who We're Looking For** - Personality traits and requirements
5. **Location & Availability** - Practical details
6. **"This Isn't For Everyone"** - Final qualifying statement
7. **CTA Button** - "Get In Touch" with mailto link

---

### Mobile Considerations

- Responsive typography (smaller headings on mobile)
- Full-width sections with appropriate padding
- Touch-friendly CTA button size
- Readable line lengths for body text

