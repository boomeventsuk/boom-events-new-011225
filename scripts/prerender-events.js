#!/usr/bin/env node
/**
 * prerender-events.js
 * Post-build: writes a static HTML shell per upcoming event at
 * dist/event/{CODE}/index.html so crawlers and link unfurlers get unique
 * title, meta description, canonical, OG tags and full Event JSON-LD without
 * executing JS. The shell is dist/index.html with the head swapped, so the
 * SPA hydrates on top of it (Netlify serves static files before the
 * /event/* rewrite).
 *
 * Reads public/events-boombastic.json (live-synced; never hand-edit event facts).
 * Run: node scripts/prerender-events.js   (wired into npm run build as postbuild)
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || "https://www.boomevents.co.uk";
const DIST = path.join(ROOT, "dist");

// Known venue street addresses (venue name -> PostalAddress fields).
// Boom event data only carries venue + city; this map adds the rest.
const VENUE_ADDRESSES = {
  "The Picturedrome": { streetAddress: "222 Kettering Road", postalCode: "NN1 4BN" },
  "Bedford Esquires": { streetAddress: "60A Bromham Road", postalCode: "MK40 2QG" },
  "MK11 Music Venue": { streetAddress: "Keller Close, Kiln Farm", postalCode: "MK11 3LH" },
  "hmv Empire": { streetAddress: "22 Hertford Street", postalCode: "CV1 1LF" },
  "Hat Factory": { streetAddress: "65-67 Bute Street", postalCode: "LU1 2EY" },
};

function ordinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] || "th";
}

// "Sat 26th Sep 2026" house date style
function formatDate(iso) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${d.getDate()}${ordinal(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function withUkOffset(iso) {
  if (!iso) return iso;
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) return iso;
  const m = Number(iso.slice(5, 7));
  return iso + (m >= 4 && m <= 10 ? "+01:00" : "+00:00");
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Netlify serves these shells at the lowercase, trailing-slash pretty URL
// (uppercase requests 301 to it), so every emitted URL must match that form
// or the canonical self-redirects.
function eventUrlFor(eventCode) {
  return `${SITE_URL}/event/${eventCode.toLowerCase()}/`;
}

function eventJsonLd(ev) {
  const url = eventUrlFor(ev.eventCode);
  const extra = VENUE_ADDRESSES[ev.venue] || {};
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: withUkOffset(ev.start),
    endDate: withUkOffset(ev.end),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    location: {
      "@type": "Place",
      name: ev.venue,
      address: {
        "@type": "PostalAddress",
        ...extra,
        addressLocality: ev.city,
        addressCountry: "GB",
      },
    },
    image: ev.image,
    description: ev.description,
    offers: {
      "@type": "Offer",
      url,
      availability: ev.isSoldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      priceCurrency: "GBP",
    },
    organizer: {
      "@type": "Organization",
      name: "Boombastic Events",
      url: `${SITE_URL}/`,
      sameAs: ["https://www.facebook.com/boombastic.eventsuk", "https://www.instagram.com/boombastic.eventsuk"],
    },
  };
}

function mustReplace(html, re, to, code) {
  if (!re.test(html)) throw new Error(`Template anchor missing for ${code}: ${re}`);
  return html.replace(re, to);
}

// Matches the homepage "Events JSON-LD" block (comment + script)
const EVENTS_GRAPH_RE = /<!-- ===== Events JSON-LD ===== -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/;

async function main() {
  let homepage = await fs.readFile(path.join(DIST, "index.html"), "utf8");
  const events = JSON.parse(
    await fs.readFile(path.join(ROOT, "public", "events-boombastic.json"), "utf8")
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => !e.isHidden && e.start.slice(0, 10) >= today);

  // Refresh the homepage Events JSON-LD graph from live data (replaces the
  // stale hand-edited block) and strip it entirely from per-event shells.
  if (!EVENTS_GRAPH_RE.test(homepage)) {
    throw new Error("Homepage Events JSON-LD block not found in dist/index.html");
  }
  const graph = {
    "@context": "https://schema.org",
    "@graph": upcoming.map(eventJsonLd).map(({ "@context": _ctx, ...rest }) => rest),
  };
  const graphBlock = `<!-- ===== Events JSON-LD ===== -->\n    <script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`;
  const template = homepage.replace(EVENTS_GRAPH_RE, "");
  homepage = homepage.replace(EVENTS_GRAPH_RE, graphBlock);
  await fs.writeFile(path.join(DIST, "index.html"), homepage);
  console.log(`prerender-events: refreshed homepage Events JSON-LD (${upcoming.length} events)`);

  let written = 0;
  for (const ev of upcoming) {
    const url = eventUrlFor(ev.eventCode);
    const title = `${ev.title} | ${formatDate(ev.start)} | Boombastic Events`;
    const description = (ev.description || ev.subtitle || "").slice(0, 160);

    let html = template;
    html = mustReplace(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, ev.eventCode);
    html = mustReplace(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`, ev.eventCode);
    html = mustReplace(html, /<meta property="og:type" content="website">/, '<meta property="og:type" content="event">', ev.eventCode);
    html = mustReplace(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`, ev.eventCode);
    html = mustReplace(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`, ev.eventCode);
    html = mustReplace(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, ev.eventCode);
    html = mustReplace(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(ev.image)}">`, ev.eventCode);
    html = mustReplace(html, /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1080">', ev.eventCode);
    html = mustReplace(html, /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="1080">', ev.eventCode);
    html = mustReplace(html, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(title)}">`, ev.eventCode);
    html = mustReplace(html, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(description)}">`, ev.eventCode);
    html = mustReplace(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${esc(ev.image)}">`, ev.eventCode);

    const extra = [
      `<link rel="canonical" href="${url}">`,
      `<script type="application/ld+json">\n${JSON.stringify(eventJsonLd(ev), null, 2)}\n</script>`,
    ].join("\n");
    html = html.replace("</head>", `${extra}\n</head>`);

    const dir = path.join(DIST, "event", ev.eventCode.toLowerCase());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html);
    written++;
  }
  console.log(`prerender-events: wrote ${written} event shells to dist/event/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
