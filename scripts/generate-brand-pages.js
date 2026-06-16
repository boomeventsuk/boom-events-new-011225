/* Brand page generator: keeps the Upcoming Events section and Event JSON-LD
   on the static brand pages in sync with public/events-boombastic.json.

   Reads:  public/events-boombastic.json
   Writes: public/<brand-dir>/index.html (in place, between marker comments)

   First run migrates the legacy hand-edited "Upcoming Events" section to
   marker comments; after that every run is idempotent. Brands with no
   upcoming events get an email-capture waitlist (Netlify form) instead of
   stale event cards. Run as part of prebuild.
*/
import { promises as fs } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  SITE_CHROME_CSS,
  SITE_HEADER_HTML,
  SITE_FOOTER_HTML,
  HEADER_START,
  HEADER_END,
  FOOTER_START,
  FOOTER_END,
  CSS_START,
  CSS_END,
} = require("./partials/site-chrome.cjs");

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || "https://www.boomevents.co.uk";
const EVENTS_PATH = path.join(ROOT, "public", "events-boombastic.json");

const BRANDS = [
  { dir: "silent-disco", prefix: "SD", name: "Silent Disco Greatest Hits", heading: "UPCOMING SILENT DISCO EVENTS" },
  { dir: "family-silent-disco", prefix: "FSD", name: "Family Silent Disco", heading: "UPCOMING FAMILY SILENT DISCO EVENTS" },
  { dir: "footloose-80s", prefix: "FL80", name: "FOOTLOOSE 80s", heading: "UPCOMING FOOTLOOSE 80s EVENTS" },
  { dir: "get-ready", prefix: "GR", name: "GET READY", heading: "UPCOMING GET READY EVENTS" },
  { dir: "boombastic-90s", prefix: "B90", name: "BOOMBASTIC 90s", heading: "UPCOMING BOOMBASTIC 90s EVENTS" },
];

const EVENTS_START = "<!-- BOOM-GEN:BRAND-EVENTS START (auto-generated, do not hand-edit) -->";
const EVENTS_END = "<!-- BOOM-GEN:BRAND-EVENTS END -->";
const JSONLD_START = "<!-- BOOM-GEN:BRAND-JSONLD START (auto-generated, do not hand-edit) -->";
const JSONLD_END = "<!-- BOOM-GEN:BRAND-JSONLD END -->";

function esc(s) {
  return (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Emoji ranges + ZWJ/variation selectors, matching src/lib/eventUtils.ts.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;

// Sanitise machine-owned feed copy for static output: strip emoji, drop any
// stale hardcoded "Tickets from £X" fragment (price comes from the feed
// priceLabel, never baked into prose), and tidy whitespace / em dashes.
function sanitiseCopy(s) {
  return (s || "")
    .toString()
    .replace(EMOJI_RE, "")
    .replace(/\bTickets?\s+from\s+(?:just\s+)?£\d+(?:\.\d{2})?\.?/gi, "")
    .replace(/[–—]/g, "-")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
}

// "From £10.00" -> "From £10" (keeps non-zero pence). Matches formatPriceLabel.
function formatPriceLabel(label) {
  return label ? label.replace(/\.00\b/, "") : "";
}

// "From £8.50" -> "8.50" for JSON-LD offers.price.
function priceFromLabel(label) {
  const m = (label || "").match(/(\d+(?:\.\d{2})?)/);
  return m ? m[1] : undefined;
}

// "Sat 26th Sep 2026" house date style
function formatDate(iso) {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][day % 10] || "th";
  return `${days[d.getDay()]} ${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function withUkOffset(iso) {
  if (!iso) return iso;
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) return iso;
  const m = Number(iso.slice(5, 7));
  return iso + (m >= 4 && m <= 10 ? "+01:00" : "+00:00");
}

function eventCard(ev) {
  const soldOut = !!ev.isSoldOut;
  // Urgency line: synced statusLabel first, then fomoOverride fallback.
  const status = soldOut
    ? null
    : sanitiseCopy(ev.statusLabel || (ev.fomoOverride && ev.fomoOverride.message) || "");
  const price = soldOut ? "" : formatPriceLabel(ev.priceLabel);
  const groupLabel = !soldOut && ev.groupTicket && ev.groupTicket.label ? ev.groupTicket.label : "";
  // price + group on one meta line, both straight from the feed
  const priceLine = [price, groupLabel].filter(Boolean).map(esc).join(" · ");
  const btn = soldOut
    ? `<a href="/event/${esc(ev.eventCode.toLowerCase())}/" class="btn" style="background:#555;">Sold Out</a>`
    : `<a href="/event/${esc(ev.eventCode.toLowerCase())}/" class="btn">Book Tickets</a>`;
  const timeDisplay = (ev.timeDisplay || "").replace(/\s*[–—]\s*/g, " - ");
  return `            <div class="event-card">
                <div class="event-info">
                    <h3>${esc(ev.title)}${soldOut ? ' <span style="color:#FF1493;">(SOLD OUT)</span>' : ""}</h3>
                    <p>${esc(formatDate(ev.start))} | ${esc(timeDisplay)} | ${esc(ev.venue)}, ${esc(ev.city)}</p>
${priceLine ? `                    <p>${priceLine}</p>\n` : ""}${status ? `                    <p style="color:#FF1493; font-weight:600;">${esc(status)}</p>\n` : ""}                </div>
                ${btn}
            </div>`;
}

function waitlistBlock(brand) {
  return `            <p>No ${esc(brand.name)} date on sale right now. The next one is coming: join the list and you hear first, before it goes on general sale.</p>
            <form name="brand-waitlist" method="POST" action="/thanks.html" data-netlify="true" style="margin-top:1.5rem; display:flex; flex-wrap:wrap; gap:0.75rem; max-width:480px;">
                <input type="hidden" name="form-name" value="brand-waitlist">
                <input type="hidden" name="brand" value="${esc(brand.name)}">
                <input type="email" name="email" required placeholder="Your email" aria-label="Your email" style="flex:1; min-width:220px; padding:0.75rem 1rem; border-radius:8px; border:1px solid #444; background:#1a1a1f; color:#fff;">
                <button type="submit" class="btn" style="border:0; cursor:pointer;">Join the List</button>
            </form>
            <p style="margin-top:0.75rem; color:#aaa; font-size:0.9rem;">No spam. Just the next ${esc(brand.name)} date.</p>`;
}

function eventsSection(brand, upcoming) {
  const inner = upcoming.length
    ? upcoming.map(eventCard).join("\n\n") +
      `\n\n            <p style="margin-top:1.5rem; color:#aaa;">More dates to be announced. Follow us on social media for first access.</p>`
    : waitlistBlock(brand);
  return `${EVENTS_START}
        <!-- Upcoming Events -->
        <section class="section">
            <h2>${esc(brand.heading)}</h2>

${inner}
        </section>
        ${EVENTS_END}`;
}

function eventJsonLd(ev) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: withUkOffset(ev.start),
    endDate: withUkOffset(ev.end),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: ev.venue,
      address: { "@type": "PostalAddress", addressLocality: ev.city, addressCountry: "GB" },
    },
    image: ev.image,
    // Feed description may carry emoji bullets and stale price prose; sanitise.
    description: sanitiseCopy(ev.description),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/event/${ev.eventCode.toLowerCase()}/`,
      availability: ev.isSoldOut
        ? "https://schema.org/SoldOut"
        : (ev.availability || "https://schema.org/InStock"),
      priceCurrency: "GBP",
      // Lowest ticket price from the feed (omit when not synced).
      ...(priceFromLabel(ev.priceLabel) ? { price: priceFromLabel(ev.priceLabel) } : {}),
    },
    organizer: {
      "@type": "Organization",
      name: "Boombastic Events",
      url: `${SITE_URL}/`,
      sameAs: ["https://www.facebook.com/boombastic.eventsuk", "https://www.instagram.com/boombastic.eventsuk"],
    },
  };
}

function jsonLdBlock(upcoming) {
  if (!upcoming.length) return `${JSONLD_START}\n    ${JSONLD_END}`;
  const scripts = upcoming
    .map((ev) => `    <script type="application/ld+json">${JSON.stringify(eventJsonLd(ev))}</script>`)
    .join("\n");
  return `${JSONLD_START}\n${scripts}\n    ${JSONLD_END}`;
}

function injectEvents(html, brand, upcoming) {
  const section = eventsSection(brand, upcoming);
  const markerRe = new RegExp(`${EVENTS_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${EVENTS_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (markerRe.test(html)) return html.replace(markerRe, section);
  // One-time migration: replace legacy hand-edited section
  const legacyRe = /<!-- Upcoming Events -->\s*<section class="section">[\s\S]*?<\/section>/;
  if (legacyRe.test(html)) return html.replace(legacyRe, section);
  throw new Error(`No events section found in ${brand.dir}`);
}

function injectJsonLd(html, upcoming) {
  const block = jsonLdBlock(upcoming);
  const markerRe = new RegExp(`${JSONLD_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${JSONLD_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (markerRe.test(html)) return html.replace(markerRe, block);
  return html.replace("</head>", `${block}\n</head>`);
}

function reEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function between(start, end) {
  return new RegExp(`${reEscape(start)}[\\s\\S]*?${reEscape(end)}`);
}

// Inject the shared chrome CSS once into <head> (before </head>), idempotent.
function injectChromeCss(html) {
  const re = between(CSS_START, CSS_END);
  if (re.test(html)) return html.replace(re, SITE_CHROME_CSS);
  return html.replace("</head>", `${SITE_CHROME_CSS}\n</head>`);
}

// Replace the legacy pink BOOMBASTIC nav + breadcrumb with the shared header.
// First run migrates the hand-edited markup; afterwards it is marker-based.
function injectHeader(html) {
  const re = between(HEADER_START, HEADER_END);
  if (re.test(html)) return html.replace(re, SITE_HEADER_HTML);

  // One-time migration: drop the legacy <nav class="nav"> ... </nav> plus the
  // following breadcrumb bar, replacing both with the shared header.
  const legacyNavBreadcrumb =
    /(?:<!-- Navigation -->\s*)?<nav class="nav">[\s\S]*?<\/nav>\s*(?:<!-- Breadcrumb -->\s*)?<div class="breadcrumb">[\s\S]*?<\/div>/;
  if (legacyNavBreadcrumb.test(html)) {
    return html.replace(legacyNavBreadcrumb, SITE_HEADER_HTML);
  }
  // Fallback: nav only (no breadcrumb).
  const legacyNav = /(?:<!-- Navigation -->\s*)?<nav class="nav">[\s\S]*?<\/nav>/;
  if (legacyNav.test(html)) return html.replace(legacyNav, SITE_HEADER_HTML);
  throw new Error("No header/nav found to replace");
}

// Replace the legacy <footer> ... </footer> with the shared footer.
function injectFooter(html) {
  const re = between(FOOTER_START, FOOTER_END);
  if (re.test(html)) return html.replace(re, SITE_FOOTER_HTML);

  const legacyFooter = /(?:<!-- Footer -->\s*)?<footer>[\s\S]*?<\/footer>/;
  if (legacyFooter.test(html)) return html.replace(legacyFooter, SITE_FOOTER_HTML);
  throw new Error("No footer found to replace");
}

async function main() {
  const events = JSON.parse(await fs.readFile(EVENTS_PATH, "utf8"));
  const today = new Date().toISOString().slice(0, 10);

  for (const brand of BRANDS) {
    const file = path.join(ROOT, "public", brand.dir, "index.html");
    let html = await fs.readFile(file, "utf8");
    const upcoming = events
      .filter((e) => e.eventCode.includes(`-${brand.prefix}-`) && e.start.slice(0, 10) >= today)
      .sort((a, b) => a.start.localeCompare(b.start));

    html = injectEvents(html, brand, upcoming);
    html = injectJsonLd(html, upcoming);
    // Unify chrome: shared header + footer + scoped CSS, replacing the legacy
    // pink BOOMBASTIC nav, breadcrumb bar and old footer.
    html = injectChromeCss(html);
    html = injectHeader(html);
    html = injectFooter(html);
    await fs.writeFile(file, html);
    console.log(`  ${brand.dir}: ${upcoming.length ? upcoming.length + " upcoming" : "waitlist"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
