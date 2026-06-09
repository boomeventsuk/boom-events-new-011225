#!/usr/bin/env node
/**
 * update-sitemap-events.js
 * Prebuild: regenerates public/sitemap.xml from public/events-boombastic.json.
 * Static pages are a fixed list below; event URLs are upcoming events only,
 * emitted as lowercase trailing-slash /event/{code}/ to match the Netlify
 * pretty URL (same rule as prerender-events.js).
 *
 * Reads public/events-boombastic.json (live-synced; never hand-edit event facts).
 * Run: node scripts/update-sitemap-events.js   (wired into npm prebuild)
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || "https://www.boomevents.co.uk";

// Static URLs, in sitemap order. Note: locations/birmingham is intentionally
// excluded (page exists but is not a live market).
const STATIC_PATHS = [
  "/",
  "/faq/",
  "/events-boombastic.json",
  "/venues.json",
  "/for-ai/",
  "/about/",
  "/silent-disco/",
  "/boombastic-90s/",
  "/footloose-80s/",
  "/get-ready/",
  "/family-silent-disco/",
  "/locations/northampton/",
  "/locations/bedford/",
  "/locations/milton-keynes/",
  "/locations/coventry/",
  "/locations/luton/",
  "/locations/leicester/",
];

async function main() {
  const events = JSON.parse(
    await fs.readFile(path.join(ROOT, "public", "events-boombastic.json"), "utf8")
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => !e.isHidden && e.start && e.start.slice(0, 10) >= today)
    .sort((a, b) => a.start.localeCompare(b.start));

  const urls = [
    ...STATIC_PATHS.map((p) => `${SITE_URL}${p}`),
    ...upcoming.map((e) => `${SITE_URL}/event/${e.eventCode.toLowerCase()}/`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join("\n")}
</urlset>
`;

  await fs.writeFile(path.join(ROOT, "public", "sitemap.xml"), xml);
  console.log(
    `update-sitemap-events: wrote sitemap.xml (${STATIC_PATHS.length} static + ${upcoming.length} upcoming events)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
