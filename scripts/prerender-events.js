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

// Emoji ranges + ZWJ/variation selectors, matching src/lib/eventUtils.ts.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;

// Sanitise machine-owned feed copy for static output: strip emoji, drop any
// stale hardcoded "Tickets from £X" fragment (price comes from the feed
// priceLabel, never baked into prose), and tidy whitespace / em dashes.
function sanitiseCopy(s) {
  return String(s || "")
    .replace(EMOJI_RE, "")
    .replace(/\bTickets?\s+from\s+(?:just\s+)?£\d+(?:\.\d{2})?\.?/gi, "")
    .replace(/[–—]/g, "-")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();
}

// "From £8.50" -> "8.50" for JSON-LD offers.price.
function priceFromLabel(label) {
  const m = (label || "").match(/(\d+(?:\.\d{2})?)/);
  return m ? m[1] : undefined;
}

const EIGHTIES_EVENT_SUBLINE = "Your best 80s night out. In the middle of the afternoon.";

function isTwoPmEightiesEdition(ev) {
  const searchable = [
    ev.eventCode,
    ev.slug,
    ev.title,
    ev.subtitle,
    ev.description,
    ev.fullDescription,
    ev.highlights,
    ev.image,
  ].filter(Boolean).join(" ");
  return /80s edition|2pm80s|2pm-80s|goes full-on 80s|your best 80s night out/i.test(searchable);
}

function displayTitle(ev) {
  if (!isTwoPmEightiesEdition(ev)) return ev.title;
  const city = ev.city || ev.location?.split(",").pop()?.trim() || ev.eventCode?.split("-")[2] || "";
  return `THE 2PM CLUB ${city}: 80s Edition Daytime Disco`.replace(/\s+:/, ":").trim();
}

function displayDescription(ev) {
  if (!isTwoPmEightiesEdition(ev)) return sanitiseCopy(ev.description || ev.subtitle || "");
  const venue = ev.venue || "";
  const city = ev.city || ev.location?.split(",").pop()?.trim() || "";
  const place = [venue, city].filter(Boolean).join(", ");
  return place
    ? `THE 2PM CLUB goes full-on 80s at ${place}. ${EIGHTIES_EVENT_SUBLINE}`
    : EIGHTIES_EVENT_SUBLINE;
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
    name: displayTitle(ev),
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
    description: displayDescription(ev),
    offers: {
      "@type": "Offer",
      url,
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

function mustReplace(html, re, to, code) {
  if (!re.test(html)) throw new Error(`Template anchor missing for ${code}: ${re}`);
  return html.replace(re, to);
}

// Matches the homepage "Events JSON-LD" block (comment + script)
const EVENTS_GRAPH_RE = /<!-- ===== Events JSON-LD ===== -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/;

// "From £10.00" -> "From £10" (keeps non-zero pence)
function cleanPrice(label) {
  return label ? label.replace(/\.00\b/, "") : "";
}

// Visible above-fold hero injected inside <div id="root"> so slow
// connections see event facts instead of a black screen while the JS
// bundle loads. React's createRoot().render() replaces the container's
// children on mount, so there is no duplicate once the app hydrates.
function shellHeroHtml(ev) {
  const price = cleanPrice(ev.priceLabel);
  const group = ev.groupTicket && ev.groupTicket.label ? ev.groupTicket.label : "";
  return [
    `<div style="min-height:70vh;display:flex;align-items:center;justify-content:center;background:#0B0B0F;color:#fff;font-family:Poppins,Arial,sans-serif;text-align:center;">`,
    `<div style="padding:96px 24px 48px;max-width:640px;">`,
    `<p style="color:#FF3CAC;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-size:0.85rem;margin:0 0 12px;">${esc(formatDate(ev.start))}</p>`,
    `<h1 style="font-size:1.75rem;line-height:1.25;margin:0 0 12px;">${esc(displayTitle(ev))}</h1>`,
    `<p style="color:rgba(255,255,255,0.8);margin:0 0 6px;">${esc(ev.venue)}, ${esc(ev.city)}</p>`,
    price ? `<p style="color:rgba(255,255,255,0.8);font-weight:600;margin:0 0 4px;">${esc(price)}</p>` : "",
    group ? `<p style="color:rgba(255,255,255,0.65);font-size:0.9rem;margin:0 0 4px;">${esc(group)}</p>` : "",
    `<p style="margin:20px 0 0;"><a href="#checkout-section" style="display:inline-block;background:#FF3CAC;color:#fff;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;">${ev.isSoldOut ? "Join the waiting list" : "Book Tickets"}</a></p>`,
    `</div>`,
    `</div>`,
  ].filter(Boolean).join("");
}

// Full event content as plain HTML inside <noscript>. The React hero inside
// #root is wiped on hydration, so without this the only text a JS-free crawler
// ever sees is the ~35-word shell. GPTBot, ClaudeBot, PerplexityBot and CCBot
// do not execute JS, so the money pages were effectively empty to exactly the
// agents we publish llms.txt for. Feed-driven only: never hand-author copy here.
function buildEventNoscript(ev) {
  const price = cleanPrice(ev.priceLabel);
  const group = ev.groupTicket && ev.groupTicket.label ? ev.groupTicket.label : "";
  const addr = ev.venueAddress || VENUE_ADDRESSES[ev.venue] || {};
  const addrLine = [addr.streetAddress, addr.addressLocality || ev.city, addr.postalCode]
    .filter(Boolean)
    .join(", ");

  const paras = sanitiseCopy(ev.fullDescription || ev.description || "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `      <p>${esc(p)}</p>`)
    .join("\n");

  const highlights = String(ev.highlights || "")
    .split("|")
    .map((h) => sanitiseCopy(h).trim())
    .filter(Boolean)
    .map((h) => `        <li>${esc(h)}</li>`)
    .join("\n");

  const facts = [
    `        <li><strong>What:</strong> ${esc(displayTitle(ev))}</li>`,
    `        <li><strong>When:</strong> ${esc(formatDate(ev.start))}${ev.timeDisplay ? `, ${esc(ev.timeDisplay)}` : ""}</li>`,
    `        <li><strong>Where:</strong> ${esc([ev.venue, addrLine].filter(Boolean).join(", "))}</li>`,
    price ? `        <li><strong>Tickets:</strong> ${esc(price)}</li>` : "",
    group ? `        <li><strong>Group tickets:</strong> ${esc(group)}</li>` : "",
    ev.statusLabel ? `        <li><strong>Status:</strong> ${esc(sanitiseCopy(ev.statusLabel))}</li>` : "",
  ].filter(Boolean).join("\n");

  return `
  <noscript>
    <article>
      <h1>${esc(displayTitle(ev))}</h1>
      <p>${esc(sanitiseCopy(ev.subtitle || ev.description || ""))}</p>
      <h2>Event details</h2>
      <ul>
${facts}
      </ul>
      <h2>About this event</h2>
${paras}
${highlights ? `      <h2>What to expect</h2>\n      <ul>\n${highlights}\n      </ul>` : ""}
      <h2>Book tickets</h2>
      <p><a href="${esc(eventUrlFor(ev.eventCode))}">Book tickets for ${esc(displayTitle(ev))} on ${esc(formatDate(ev.start))}</a></p>
      <h2>About Boombastic Events</h2>
      <p>Boombastic Events is a Midlands-based events company running daytime discos, silent discos and decades parties across Northampton, Bedford, Milton Keynes, Coventry, Luton and Leicester.</p>
      <p>Contact: hello@boomevents.co.uk</p>
    </article>
  </noscript>`;
}

// Minimal noindex "gone" shell for expired events. Served with a 410 via
// the forced redirect lines appended to dist/_redirects below.
function goneShellHtml(ev) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>This event has ended | Boombastic Events</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B0B0F;color:#fff;font-family:Poppins,Arial,sans-serif;text-align:center;">
  <main style="padding:40px 24px;max-width:560px;">
    <h1 style="font-size:1.5rem;line-height:1.3;margin:0 0 12px;">${esc(displayTitle(ev))}</h1>
    <p style="color:rgba(255,255,255,0.75);margin:0 0 20px;">This event has ended.</p>
    <p style="margin:0;"><a href="/#tickets" style="color:#FF3CAC;font-weight:600;text-decoration:none;">See upcoming events</a></p>
  </main>
</body>
</html>
`;
}

// Insert forced 410 lines for expired event paths into dist/_redirects,
// just before the /event/* SPA fallback so they win the ordering. The
// force flag (!) is required because a static gone shell exists at the
// path and Netlify would otherwise serve it with a 200.
const SPA_FALLBACK_RE = /^\/event\/\*\s+\/index\.html\s+200\s*$/m;

async function writeExpiredEvents(events, today) {
  const past = events.filter((e) => e.start && e.start.slice(0, 10) < today);
  if (past.length === 0) return;

  for (const ev of past) {
    const dir = path.join(DIST, "event", ev.eventCode.toLowerCase());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), goneShellHtml(ev));
  }

  const redirectsPath = path.join(DIST, "_redirects");
  let redirects = await fs.readFile(redirectsPath, "utf8");
  if (redirects.includes("# Expired events: 410 Gone")) {
    console.log("prerender-events: expired-event 410 redirects already present, skipping");
    return;
  }
  if (!SPA_FALLBACK_RE.test(redirects)) {
    throw new Error("dist/_redirects: /event/* SPA fallback line not found");
  }
  const lines = past
    .map((ev) => {
      const code = ev.eventCode.toLowerCase();
      return `/event/${code}        /event/${code}/index.html    410!\n/event/${code}/*      /event/${code}/index.html    410!`;
    })
    .join("\n");
  redirects = redirects.replace(
    SPA_FALLBACK_RE,
    `# Expired events: 410 Gone (generated by prerender-events.js)\n${lines}\n\n$&`
  );
  await fs.writeFile(redirectsPath, redirects);
  console.log(`prerender-events: wrote ${past.length} expired-event gone shells + 410 redirects`);
}

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
    const title = `${displayTitle(ev)} | ${formatDate(ev.start)} | Boombastic Events`;
    const description = displayDescription(ev).slice(0, 160);

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

    // index.html now ships a homepage canonical, so point the template's tag at
    // this event rather than appending a second one and emitting two canonicals.
    html = mustReplace(
      html,
      /<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${url}">`,
      ev.eventCode
    );

    const extra = `<script type="application/ld+json">\n${JSON.stringify(eventJsonLd(ev), null, 2)}\n</script>`;
    html = html.replace("</head>", `${extra}\n</head>`);

    // Visible above-fold content inside the root div (replaced on hydration)
    html = mustReplace(
      html,
      /<div id="root"><\/div>/,
      `<div id="root">${shellHeroHtml(ev)}</div>${buildEventNoscript(ev)}`,
      ev.eventCode
    );

    const dir = path.join(DIST, "event", ev.eventCode.toLowerCase());
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html);
    written++;
  }
  console.log(`prerender-events: wrote ${written} event shells to dist/event/`);

  // Expired events: noindex gone shells + 410 redirect lines so old URLs
  // stop returning an indexable homepage clone with a 200.
  await writeExpiredEvents(events, today);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
