

## Plan: FOMO Badges, Title Fixes & New Northampton Event

### Understanding the Current System

The FOMO badge data comes from two sources:
1. **Database (`events_fomo`)** - synced from Notion (currently shows "NOW ON SALE" for everything because Notion says full capacity)
2. **Static `badge` prop** in JSON - used as fallback when no FOMO data exists

Since the dynamic system isn't reflecting your actual ticket sales, I'll add manual override fields to the JSON that take precedence over the database data.

---

### 1. Fix Luton Title
**File:** `public/events-boombastic.json`

Current:
```
"title": "THE 2PM CLUB Luton"
```

Change to:
```
"title": "THE 2PM CLUB Luton — 80s 90s 00s Daytime Disco"
```

---

### 2. Add Manual FOMO Override Fields to JSON

Add new `fomoOverride` objects to relevant events that will take priority over database FOMO data:

**Luton (This Saturday - 25 tickets left):**
```json
"fomoOverride": {
  "tier": "critical",
  "message": "LAST 25 TICKETS!",
  "timeMessage": "THIS SATURDAY!"
}
```

**Bedford (2 weeks - 50 tickets left):**
```json
"fomoOverride": {
  "tier": "urgent", 
  "message": "LAST 50 TICKETS!",
  "timeMessage": "2 WEEKS TO GO!"
}
```

**Coventry, Milton Keynes & other events:**
```json
"fomoOverride": {
  "tier": "selling_fast",
  "message": "SELLING FAST!",
  "timeMessage": null
}
```

---

### 3. Update EventCard to Respect JSON Overrides
**File:** `src/components/EventCard.tsx`

Add logic to check for `fomoOverride` from the event data and use it instead of database FOMO when present.

---

### 4. Update Tickets Component to Pass Override
**File:** `src/components/Tickets.tsx`

Pass the `fomoOverride` data from JSON to `EventCard`.

---

### 5. Add New June 2026 Northampton Event
**File:** `public/events-boombastic.json`

Based on the external site content:

```json
{
  "eventCode": "060626-2PM-NPTON",
  "title": "THE 2PM CLUB Northampton — 80s 90s 00s Daytime Disco",
  "subtitle": "Your best night out, right in the middle of the afternoon...",
  "date": "Saturday, 6 June 2026",
  "timeDisplay": "09:00 – 13:00",
  "start": "2026-06-06T09:00:00",
  "end": "2026-06-06T13:00:00",
  "venue": "Cinch Stadium (Franklin's Gardens)",
  "city": "Northampton",
  "image": "https://boombastic-events.b-cdn.net/060626_2PM_NPTON/280226_2PM_NPTON_060626_2PM_NPTON%20ANNSQ.jpg",
  "description": "THE 2PM CLUB Northampton — 4 hours of iconic 80s, 90s & 00s anthems at Franklin's Gardens!",
  "eventbriteId": "1234567890123",
  "fullDescription": "...",
  "highlights": "...",
  "fomoOverride": {
    "tier": "selling_fast",
    "message": "SELLING FAST!",
    "timeMessage": null
  }
}
```

---

### 6. Update Sitemap
**File:** `public/sitemap.xml`

Add the new event URL.

---

### Summary of Changes

| File | Change |
|------|--------|
| `public/events-boombastic.json` | Fix Luton title, add `fomoOverride` fields to all events, add new June 2026 Northampton event |
| `src/components/EventCard.tsx` | Accept and prioritise `fomoOverride` data from props |
| `src/components/Tickets.tsx` | Pass `fomoOverride` from event data to EventCard |
| `public/sitemap.xml` | Add new event URL |

---

### Visual Result

| Event | Badge | Time Badge |
|-------|-------|------------|
| Luton (7 Feb) | 🔴 LAST 25 TICKETS! (pulsing red) | THIS SATURDAY! |
| Bedford (14 Feb) | 🟠 LAST 50 TICKETS! (amber) | 2 WEEKS TO GO! |
| Coventry (7 Mar) | 🟡 SELLING FAST! | — |
| Milton Keynes (14 Mar) | 🟡 SELLING FAST! | — |
| Other events | 🟡 SELLING FAST! | — |

---

### Technical Notes

- **Why override instead of fixing Notion?** This gives you immediate control without waiting for the Notion sync cron job. You can update urgency messaging instantly.
- **Eventbrite ID needed:** The external site's Eventbrite ID wasn't visible in the scraped content. I'll need you to provide the Eventbrite ID for the June 6th event, or I can use a placeholder.

