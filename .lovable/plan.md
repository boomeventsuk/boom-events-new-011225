

## How Social Sharing Works (and Why We Need a Change)

When you share a link on WhatsApp, it sends a bot to fetch the page and looks for a specific tag in the HTML called `og:image`. This bot does **not** run JavaScript — it just reads the raw HTML.

Because this site is a single-page app (SPA), every page serves the same `index.html` with the same generic Boom Events image in that tag. Even though your React code sets the correct image when a user views the page in a browser, WhatsApp's bot never sees it.

**This is why you always get the generic image when sharing.**

## The Fix: Netlify Edge Function

Since the site is on Netlify, we add a small server-side function that:

1. Detects when WhatsApp/Facebook/Twitter bots request an event page
2. Looks up the event in `events-boombastic.json`
3. Returns the correct `og:image` tag with that event's poster image
4. Normal users still get the regular site — no visible change

This is the standard, widely-used approach for SPAs. There is no simpler alternative that works — WhatsApp will never execute your JavaScript to find the image.

## Implementation

1. **Create `netlify/edge-functions/og-event.ts`** — detects crawler user-agents, serves correct OG tags per event
2. **Update `netlify.toml`** — route `/events/*` through the edge function
3. No changes to React components needed

