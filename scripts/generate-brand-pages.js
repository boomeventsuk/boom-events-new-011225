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
  const fomo = !soldOut && ev.fomoOverride && ev.fomoOverride.message ? ev.fomoOverride.message : null;
  const btn = soldOut
    ? `<a href="/event/${esc(ev.eventCode.toLowerCase())}/" class="btn" style="background:#555;">Sold Out</a>`
    : `<a href="/event/${esc(ev.eventCode.toLowerCase())}/" class="btn">Book Tickets</a>`;
  return `            <div class="event-card">
                <div class="event-info">
                    <h3>${esc(ev.title)}${soldOut ? ' <span style="color:#FF1493;">(SOLD OUT)</span>' : ""}</h3>
                    <p>${esc(formatDate(ev.start))} | ${esc(ev.timeDisplay)} | ${esc(ev.venue)}, ${esc(ev.city)}</p>
${fomo ? `                    <p style="color:#FF1493; font-weight:600;">${esc(fomo)}</p>\n` : ""}                </div>
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
    description: ev.description,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/event/${ev.eventCode.toLowerCase()}/`,
      availability: ev.isSoldOut
        ? "https://schema.org/SoldOut"
        : (ev.availability || "https://schema.org/InStock"),
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
    await fs.writeFile(file, html);
    console.log(`  ${brand.dir}: ${upcoming.length ? upcoming.length + " upcoming" : "waitlist"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
