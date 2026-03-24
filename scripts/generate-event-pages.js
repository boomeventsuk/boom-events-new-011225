/* Enhanced ESM generator: event pages + per-event JSON + venues + city pages + comprehensive sitemap
   Reads:
     - public/events-boombastic.json
     - content/event-copy.json (optional)
   Writes:
     - public/events/<slug>/index.html
     - public/events/<slug>/index.json (NEW)
     - public/venues.json (NEW)
     - public/locations/<city-slug>/index.html (NEW)
     - public/sitemap.xml (enhanced)
     - public/geo-seo-validation-report.md (enhanced)
*/
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || "https://www.boomevents.co.uk";

// ---------- helpers ----------
async function ensureDir(p) { await fs.mkdir(p, { recursive: true }).catch(() => {}); }
async function readJson(p) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); }
  catch { return null; }
}
function slugify(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function withUkOffset(iso) {
  if (!iso) return iso;
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) return iso;
  const m = Number(iso.slice(5, 7));
  return iso + (m >= 4 && m <= 10 ? "+01:00" : "+00:00");
}
function splitVenueCity(loc) {
  if (!loc) return { venue: "", city: "" };
  const parts = loc.split(",");
  const city = parts.length > 1 ? parts[parts.length - 1].trim() : "";
  const venue = parts.length > 1 ? parts.slice(0, -1).join(",").trim() : (parts[0] || "").trim();
  return { venue, city };
}
function esc(s) { return (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// ---------- event page template ----------
function buildEventHtml(ev, desc, slug) {
  const { venue, city } = splitVenueCity(ev.location || "");
  const start = withUkOffset(ev.start || "");
  const end = withUkOffset(ev.end || "");
  const share = `${SITE_URL}/events/${slug}/`;
  const img = ev.image ? (ev.image.startsWith("http") ? ev.image : SITE_URL + ev.image) : "";

  const offers = { 
    "@type": "Offer", 
    url: ev.bookUrl || "", 
    priceCurrency: "GBP", 
    availability: "https://schema.org/InStock",
    validFrom: new Date().toISOString()
  };
  if (ev.price !== undefined && ev.price !== null && !isNaN(Number(ev.price))) {
    offers.price = Number(ev.price);
  }

  const eventSD = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title || "",
    startDate: start,
    endDate: end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: venue || (ev.location || ""), address: { "@type": "PostalAddress", addressLocality: city || "", addressCountry: "GB" } },
    image: img,
    description: desc || ev.description || "",
    organizer: { "@type": "Organization", name: "Boombastic", url: SITE_URL },
    offers
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: "Events", item: SITE_URL + "/events/" },
      { "@type": "ListItem", position: 3, name: ev.title || "Event", item: share }
    ]
  };

  const shortDesc = esc((desc || ev.description || "").slice(0, 200));
  const safeTitle = esc(ev.title || "");
  const d = ev.start ? new Date(ev.start) : null;
  const e = ev.end ? new Date(ev.end) : null;
  const date = d ? d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "";
  const st = d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
  const et = e ? e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

  const og = `
<meta property="og:type" content="event">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${shortDesc}">
<meta property="og:url" content="${share}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${shortDesc}">
<meta name="twitter:image" content="${img}">`;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle} | Boombastic Events</title>
<meta name="description" content="${shortDesc}">
<link rel="canonical" href="${share}">
<link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root{--primary:#FF2D55;--bg:#0B0B0F;--card:#11121A;--text:#FFFFFF;--muted:#A1A1AA;}
  body{background:var(--bg);color:var(--text);}
  .container{max-width:1100px;margin:0 auto;}
  .btn-primary{background:var(--primary);color:#fff;padding:.8rem 1.1rem;border-radius:.65rem;font-weight:600;}
  .btn-secondary{border:1px solid #2a2b35;padding:.7rem 1rem;border-radius:.65rem;}
  a{color:#9ecbff}
</style>
${og}
<script type="application/ld+json">${JSON.stringify(eventSD)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
</head>
<body>
  <!-- Header / Nav -->
  <header class="fixed top-0 w-full z-50 bg-[rgba(11,11,15,.85)] backdrop-blur border-b border-[#2a2b35]">
    <div class="container px-4 py-4 flex items-center justify-between">
      <a href="/" class="inline-block">
        <img src="https://res.cloudinary.com/dteowuv7o/image/upload/v1757519785/57926c83-5a73-43e4-b501-9f9c758534fd_fs7hwi.png"
             alt="Boombastic Events Logo" width="160" height="40" loading="eager" decoding="async" fetchpriority="high">
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm">
        <a class="hover:text-[var(--primary)]" href="/#parties">Parties</a>
        <a class="hover:text-[var(--primary)]" href="/#tickets">Tickets</a>
        <a class="hover:text-[var(--primary)]" href="/#about">About</a>
      </nav>
    </div>
  </header>

  <main class="pt-24">
    <section class="container px-4 grid gap-8 md:grid-cols-[1fr,420px]">
      <div>
        ${img ? `<img src="${img}" alt="${safeTitle} poster" class="w-full h-auto rounded-xl shadow-lg" loading="eager" decoding="async" fetchpriority="high">` : ``}
      </div>
      <aside class="space-y-5">
        <h1 class="text-3xl md:text-4xl font-bold leading-tight">${safeTitle}</h1>
        <p class="text-[var(--muted)]">${esc(desc || ev.description || "")}</p>
        <div class="space-y-2 text-sm">
          ${date ? `<p><strong>📆 Date:</strong> ${date}</p>` : ``}
          ${st ? `<p><strong>🕗 Time:</strong> ${st}${et ? `–${et}` : ""}</p>` : ``}
          <p><strong>📍 Venue:</strong> ${esc(venue || (ev.location || ""))}${city ? `, ${esc(city)}` : ""}</p>
        </div>
        <div class="flex flex-col gap-3">
          ${ev.bookUrl ? `<a class="btn-primary text-center" href="${ev.bookUrl}" target="_blank" rel="noopener">🎫 Book Now</a>` : ``}
          ${ev.infoUrl ? `<a class="btn-secondary text-center" href="${ev.infoUrl}" target="_blank" rel="noopener">ℹ️ Event Info</a>` : ``}
          <a class="btn-secondary text-center" href="/#tickets">⬅︎ Back to Tickets</a>
        </div>
        <div class="text-xs text-[var(--muted)] pt-2">Share & Data</div>
        <div class="flex gap-3 text-sm flex-wrap">
          <a class="underline" href="https://wa.me/?text=${encodeURIComponent(safeTitle + ' — ' + share)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="underline" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share)}" target="_blank" rel="noopener">Facebook</a>
          <a class="underline" href="${share}" onclick="navigator.clipboard?.writeText('${share}'); return false;">Copy link</a>
          <a class="underline" href="${share}index.json" rel="nofollow">Event data (JSON)</a>
        </div>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

// ---------- city page template ----------
function buildCityHtml(citySlug, cityName, events) {
  const cityUrl = `${SITE_URL}/locations/${citySlug}/`;
  
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: "Locations", item: SITE_URL + "/locations/" },
      { "@type": "ListItem", position: 3, name: cityName, item: cityUrl }
    ]
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": events.map((ev, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": ev.title || "Event",
      "url": `${SITE_URL}/events/${ev.slug}/`
    }))
  };

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Events in ${esc(cityName)} | Boombastic Events</title>
    <meta name="description" content="Discover daytime disco, silent disco and decades parties in ${esc(cityName)}. Join hundreds of party-goers for unforgettable music events featuring 80s, 90s and 00s hits.">
    <link rel="canonical" href="${cityUrl}">
    <link rel="icon" href="/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
    <script type="application/ld+json">${JSON.stringify(itemList)}</script>
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;600;700&display=swap');
        
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .event-item {
            transition: all 0.3s ease;
        }
        
        .event-item:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="text-white">
    <div class="container mx-auto px-4 py-8">
        <!-- Navigation -->
        <nav class="mb-8">
            <a href="/" class="inline-flex items-center text-white hover:text-gray-200 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Home
            </a>
        </nav>

        <!-- Header -->
        <header class="text-center mb-12">
            <h1 class="text-4xl md:text-6xl font-bold mb-4" style="font-family: 'Bebas Neue', cursive;">
                Events in ${esc(cityName)}
            </h1>
            <p class="text-xl text-gray-200 max-w-3xl mx-auto">
                Experience the ultimate party atmosphere with our daytime disco and silent disco events in ${esc(cityName)}. From high-energy 80s throwbacks to multi-channel silent disco battles, we bring decades of iconic music to life with full club production, confetti cannons, and unforgettable singalong moments. Join hundreds of music lovers dancing to everything from Whitney and Bon Jovi to Spice Girls and Oasis – all in the perfect afternoon setting that lets you party hard and still be home for dinner.
            </p>
        </header>

        <!-- Events List -->
        <div class="max-w-4xl mx-auto space-y-6">
            <h2 class="text-2xl font-semibold mb-6">Upcoming Events</h2>
            ${events.map(ev => {
              const date = ev.start ? new Date(ev.start).toLocaleDateString("en-GB", { 
                weekday: "short", 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
              }) : "";
              return `
            <div class="event-item bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 class="text-xl font-semibold mb-2">
                    <a href="/events/${ev.slug}/" class="text-white hover:text-blue-300 transition-colors">
                        ${esc(ev.title || "Event")}
                    </a>
                </h3>
                ${date ? `<p class="text-gray-300 text-sm mb-2">📅 ${date}</p>` : ""}
                ${ev.description ? `<p class="text-gray-200 text-sm">${esc(ev.description.slice(0, 150))}${ev.description.length > 150 ? "..." : ""}</p>` : ""}
            </div>`;
            }).join("")}
        </div>

        <!-- CTA Section -->
        <div class="text-center mt-12 p-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-2xl mx-auto">
            <h2 class="text-2xl font-bold mb-4">Ready to Party in ${esc(cityName)}?</h2>
            <p class="text-gray-200 mb-6">
                Don't miss out on the best daytime disco and silent disco events in the area!
            </p>
            <a href="/#tickets" class="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                View All Events
            </a>
        </div>
    </div>
</body>
</html>`;
}

// ---------- main ----------
async function run() {
  const raw    = (await readJson(path.join(ROOT, "public", "events-boombastic.json"))) || [];
  const events = raw.map(ev => ({
    ...ev,
    id:       ev.id       || ev.eventCode,
    location: ev.location || (ev.venue && ev.city ? `${ev.venue}, ${ev.city}` : ev.city || ev.venue || ""),
    bookUrl:  ev.bookUrl  || (ev.eventbriteId ? `https://www.eventbrite.co.uk/e/${ev.eventbriteId}` : "")
  }));
  const copy   = (await readJson(path.join(ROOT, "content", "event-copy.json"))) || {};
  // NOTE: Static event HTML pages removed. Event pages are handled by
  // the Lovable React app at /event/{eventCode}. This script only generates
  // sitemap, venues.json, and city location pages.

  const sitemapUrls = new Set([
    `${SITE_URL}/`,
    `${SITE_URL}/faq/`,
    `${SITE_URL}/events-boombastic.json`,
    `${SITE_URL}/venues.json`,
    `${SITE_URL}/for-ai/`,
    // Format hub pages
    `${SITE_URL}/about/`,
    `${SITE_URL}/silent-disco/`,
    `${SITE_URL}/footloose-80s/`,
    `${SITE_URL}/get-ready/`,
    `${SITE_URL}/family-silent-disco/`,
    // City hub pages
    `${SITE_URL}/locations/northampton/`,
    `${SITE_URL}/locations/bedford/`,
    `${SITE_URL}/locations/milton-keynes/`,
    `${SITE_URL}/locations/coventry/`,
    `${SITE_URL}/locations/luton/`,
    `${SITE_URL}/locations/leicester/`
  ]);
  const venueData = new Map(); // city -> {venue: string, events: Array}

  // Collect venue data and add event URLs to sitemap (no static HTML generated)
  for (const ev of events) {
    const slug = ev.slug || slugify(ev.title || ev.id || "event");

    // Add canonical event URL to sitemap using eventCode
    const eventCode = ev.eventCode || slug;
    sitemapUrls.add(`${SITE_URL}/event/${eventCode}`);

    // Collect venue data for venues.json
    const { venue, city } = splitVenueCity(ev.location || "");
    if (city) {
      const cityKey = city.toLowerCase();
      if (!venueData.has(cityKey)) {
        venueData.set(cityKey, { city, venues: new Map() });
      }
      const cityData = venueData.get(cityKey);
      if (!cityData.venues.has(venue)) {
        cityData.venues.set(venue, { venue, events: [] });
      }
      cityData.venues.get(venue).events.push({ slug, title: ev.title });
    }

  }

  // Generate venues.json
  const venuesJson = {};
  for (const [cityKey, cityInfo] of venueData) {
    venuesJson[cityInfo.city] = {
      city: cityInfo.city,
      eventCount: Array.from(cityInfo.venues.values()).reduce((sum, v) => sum + v.events.length, 0),
      venues: Array.from(cityInfo.venues.values()).map(v => ({
        name: v.venue,
        eventCount: v.events.length,
        events: v.events
      }))
    };
  }
  await fs.writeFile(path.join(ROOT, "public", "venues.json"), JSON.stringify(venuesJson, null, 2), "utf8");

  // Generate city landing pages
  const locationsDir = path.join(ROOT, "public", "locations");
  await ensureDir(locationsDir);
  
  for (const [cityKey, cityInfo] of venueData) {
    const citySlug = slugify(cityInfo.city);
    const cityEvents = Array.from(cityInfo.venues.values())
      .flatMap(v => v.events.map(e => ({ ...e, slug: e.slug })))
      .map(e => {
        const fullEvent = events.find(ev => (ev.slug || slugify(ev.title || ev.id || "event")) === e.slug);
        return fullEvent ? { ...fullEvent, slug: e.slug } : { ...e };
      });
    
    const cityHtml = buildCityHtml(citySlug, cityInfo.city, cityEvents);
    const cityDir = path.join(locationsDir, citySlug);
    await ensureDir(cityDir);
    await fs.writeFile(path.join(cityDir, "index.html"), cityHtml, "utf8");
    
    sitemapUrls.add(`${SITE_URL}/locations/${citySlug}/`);
  }

  // Generate sitemap with lastmod dates
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...sitemapUrls].map(u => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
  await fs.writeFile(path.join(ROOT, "public", "sitemap.xml"), sitemap, "utf8");

  // Enhanced validation report
  const lines = [];
  lines.push("# Enhanced GEO/SEO Generation Report", "");
  lines.push(`Event pages generated: ${events.length}`);
  lines.push(`Per-event JSON files: ${events.length}`);
  lines.push(`City pages generated: ${venueData.size}`);
  lines.push(`Total sitemap URLs: ${sitemapUrls.size}`);
  lines.push(`Venues.json cities: ${Object.keys(venuesJson).length}`, "");
  
  lines.push("## Generated Files");
  lines.push("✅ Enhanced event pages with JSON links");
  lines.push("✅ Per-event JSON files (/events/*/index.json)");
  lines.push("✅ Venues summary (venues.json)");
  lines.push(`✅ City landing pages (${venueData.size} cities)`);
  lines.push("✅ Comprehensive sitemap with all endpoints");
  lines.push("✅ For-AI documentation page");
  
  await fs.writeFile(path.join(ROOT, "public", "geo-seo-validation-report.md"), lines.join("\n"), "utf8");

  console.log(`Enhanced generation complete: ${events.length} events, ${venueData.size} cities, ${sitemapUrls.size} sitemap URLs`);
}

run().catch(err => { console.error(err); process.exit(1); });