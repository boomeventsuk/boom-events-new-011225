#!/usr/bin/env node
/**
 * generate-location-pages.js
 *
 * Reads events-boombastic.json + scripts/location-config.json, writes
 * a static HTML page per city to public/locations/{citySlug}/index.html.
 *
 * Run manually: npm run regenerate-locations
 * Run by M2: ~/scheduled-tasks daily 04:15
 *
 * Source of truth is JSON. Pages are derived. Idempotent.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EVENTS_PATH = path.join(ROOT, 'public', 'events-boombastic.json');
const CONFIG_PATH = path.join(ROOT, 'scripts', 'location-config.json');
const OUT_DIR = path.join(ROOT, 'public', 'locations');
const SITE_URL = 'https://www.boomevents.co.uk';

// Tracking block mirrored from the brand pages (source of truth: /index.html).
// GTM + Meta Pixel + GA4, consent-defaulted to denied for GDPR.
const TRACKING_HEAD = `  <!-- Tracking block injected from /index.html source of truth. Mirror of the brand pages. -->
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-PJGV534N');</script>
  <!-- End Google Tag Manager -->

  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('consent', 'revoke');
  fbq('init', '1947538679159165');
  </script>
  <!-- End Meta Pixel Code -->

  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-FE0H4X5BBS"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    // Default to denied for GDPR compliance
    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied'
    });

    gtag('js', new Date());
    gtag('config', 'G-FE0H4X5BBS', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  <!-- End Google Analytics 4 -->`;

const TRACKING_NOSCRIPT = `  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PJGV534N"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->

  <!-- Meta Pixel (noscript) -->
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=1947538679159165&ev=PageView&noscript=1"/></noscript>
  <!-- End Meta Pixel (noscript) -->`;

// --- helpers ---
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseStart(s) {
  // start strings look like "2026-06-13T14:00:00", naive UK local
  return new Date(s);
}

function formatShortDate(startISO) {
  // "Sat 13 Jun 2026"
  const d = parseStart(startISO);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function fomoBadge(event) {
  const o = event.fomoOverride;
  if (!o || !o.tier) return null;
  const tier = o.tier;
  const message = o.message || tier.replace(/_/g, ' ').toUpperCase();
  return { tier, message };
}

function endISO(event) {
  if (event.end) return event.end;
  // fall back: +4h
  const d = parseStart(event.start);
  d.setHours(d.getHours() + 4);
  return d.toISOString().replace(/\.\d{3}Z$/, '');
}

function availabilitySchema(event) {
  if (event.isSoldOut) return 'https://schema.org/SoldOut';
  const tier = event.fomoOverride && event.fomoOverride.tier;
  if (tier === 'critical' || tier === 'selling_fast') return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/InStock';
}

// --- render ---
function renderEventCard(event) {
  const fomo = fomoBadge(event);
  const fomoClass = fomo
    ? `fomo-${fomo.tier.replace(/_/g, '-')}`
    : '';
  const fomoHtml = fomo
    ? `<span class="fomo-badge ${fomoClass}">${esc(fomo.message)}</span>`
    : '';
  return `
      <article class="event-card">
        <div class="image-wrap">
          <img src="${esc(event.image)}" alt="${esc(event.title)}" loading="lazy">
          ${fomoHtml}
        </div>
        <div class="body">
          <div class="meta">
            <span>${esc(formatShortDate(event.start))}</span>
            <span>${esc(event.timeDisplay || '')}</span>
            <span>${esc(event.venue || '')}</span>
          </div>
          <h3>${esc(event.title)}</h3>
          <p class="desc">${esc(event.subtitle || event.description || '')}</p>
          <a href="/event/${esc(event.eventCode.toLowerCase())}/" class="cta">View Event &amp; Book →</a>
        </div>
      </article>`;
}

function renderEventsSection(events, cityName) {
  if (events.length === 0) {
    return `
    <h2 class="section-title">Upcoming Events</h2>
    <p class="section-sub">No events currently scheduled in ${esc(cityName)}.</p>
    <div class="empty-state">
      <p>New ${esc(cityName)} dates are announced throughout the year.</p>
      <a href="/" class="cta-secondary">See all upcoming events →</a>
    </div>`;
  }
  const cards = events.map(renderEventCard).join('\n');
  return `
    <h2 class="section-title">Upcoming Events</h2>
    <p class="section-sub">${events.length} event${events.length === 1 ? '' : 's'} coming up in ${esc(cityName)}</p>
    <div class="events-grid">
${cards}
    </div>`;
}

function renderJsonLD(cityCfg, events) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Locations", "item": `${SITE_URL}/locations/` },
      { "@type": "ListItem", "position": 3, "name": cityCfg.cityName, "item": `${SITE_URL}/locations/${cityCfg.citySlug}/` }
    ]
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": events.map((e, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SITE_URL}/event/${e.eventCode.toLowerCase()}/`,
      "name": e.title
    }))
  };

  const eventLDs = events.map(e => ({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": e.title,
    "startDate": e.start,
    "endDate": endISO(e),
    "eventStatus": e.isSoldOut ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": e.venue || cityCfg.cityName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cityCfg.cityName,
        "addressCountry": "GB"
      }
    },
    "image": e.image,
    "description": e.description || e.subtitle || '',
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/event/${e.eventCode.toLowerCase()}/`,
      "availability": availabilitySchema(e),
      "priceCurrency": "GBP"
    },
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": `${SITE_URL}/`
    }
  }));

  const business = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "name": `Boombastic Events - ${cityCfg.cityName}`,
    "url": `${SITE_URL}/locations/${cityCfg.citySlug}/`,
    "areaServed": { "@type": "City", "name": cityCfg.cityName },
    "address": { "@type": "PostalAddress", "addressLocality": cityCfg.cityName, "addressCountry": "GB" }
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (cityCfg.faq || []).map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  const blocks = [breadcrumb, itemList, ...eventLDs, business];
  if (cityCfg.faq && cityCfg.faq.length) blocks.push(faq);

  return blocks
    .map(b => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n');
}

function renderFaqSection(cityCfg) {
  if (!cityCfg.faq || cityCfg.faq.length === 0) return '';
  const items = cityCfg.faq.map(f => `
    <div class="faq-item">
      <h3>${esc(f.q)}</h3>
      <p>${esc(f.a)}</p>
    </div>`).join('\n');
  return `
  <section class="section" id="faq">
    <h2 class="section-title">${esc(cityCfg.cityName)} FAQs</h2>
    <p class="section-sub">Quick answers for first-timers</p>
    ${items}
  </section>`;
}

function renderAboutSection(cityCfg, heroImage) {
  const paras = (cityCfg.aboutBody || []).map(p => `<p style="color:rgba(255,255,255,0.75); margin-bottom: 16px;">${esc(p)}</p>`).join('\n');
  if (!heroImage) {
    return `
  <section class="section">
    <h2 class="section-title">${esc(cityCfg.aboutTitle)}</h2>
    ${paras}
  </section>`;
  }
  return `
  <section class="section">
    <div class="about-grid">
      <div>
        <h2 class="section-title">${esc(cityCfg.aboutTitle)}</h2>
        ${paras}
      </div>
      <img src="${esc(heroImage)}" alt="${esc(cityCfg.cityName)} party crowd">
    </div>
  </section>`;
}

function renderHTML(cityCfg, events) {
  const heroImage = events.length ? events[0].image : null;
  const og = heroImage || `${SITE_URL}/og-default.jpg`;
  const title = events.length
    ? `Daytime Disco & Live Events in ${cityCfg.cityName} | Boombastic Events`
    : `Events in ${cityCfg.cityName} | Boombastic Events`;

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
${TRACKING_HEAD}

  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(cityCfg.metaDescription)}">
  <link rel="canonical" href="${SITE_URL}/locations/${cityCfg.citySlug}/">
  <link rel="icon" href="/favicon.ico">

  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(cityCfg.metaDescription)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/locations/${cityCfg.citySlug}/">
  <meta property="og:image" content="${esc(og)}">

  ${renderJsonLD(cityCfg, events)}

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Poppins', sans-serif; background: #0b0b0d; color: #fff; line-height: 1.6; -webkit-font-smoothing: antialiased; }
    a { color: inherit; text-decoration: none; }
    img { display: block; max-width: 100%; height: auto; }
    .site-header { position: sticky; top: 0; z-index: 50; background: rgba(11,11,13,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,0.06); }
    .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; }
    .site-logo img { height: 36px; }
    .primary-nav { display: flex; gap: 24px; align-items: center; }
    .primary-nav a { color: rgba(255,255,255,0.75); font-size: 14px; transition: color .2s; }
    .primary-nav a:hover, .primary-nav a.active { color: #fff; }
    .book-cta { background: #ff3366; color: #fff; padding: 10px 22px; border-radius: 999px; font-weight: 600; font-size: 14px; transition: transform .2s, background .2s; }
    .book-cta:hover { background: #ff1a52; transform: translateY(-1px); }
    @media (max-width: 800px) { .primary-nav { display: none; } }
    .hero { padding: 80px 24px 60px; max-width: 1200px; margin: 0 auto; text-align: center; }
    .hero .eyebrow { color: #ff3366; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .hero h1 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(48px, 8vw, 96px); letter-spacing: 1px; line-height: 1; margin-bottom: 20px; }
    .hero p { max-width: 720px; margin: 0 auto; font-size: 18px; color: rgba(255,255,255,0.75); }
    .section { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 1px; margin-bottom: 8px; }
    .section-sub { color: rgba(255,255,255,0.6); margin-bottom: 28px; }
    .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .event-card { background: #15151a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; transition: transform .25s, border-color .25s; display: flex; flex-direction: column; }
    .event-card:hover { transform: translateY(-4px); border-color: rgba(255,51,102,0.5); }
    .event-card .image-wrap { position: relative; aspect-ratio: 1/1; overflow: hidden; }
    .event-card .image-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .fomo-badge { position: absolute; top: 12px; left: 12px; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    .fomo-critical { background: #ff3366; color: #fff; }
    .fomo-selling-fast { background: #ffa500; color: #000; }
    .fomo-on-sale { background: #00c896; color: #000; }
    .fomo-sold-out { background: #555; color: #fff; }
    .event-card .body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .event-card .meta { font-size: 13px; color: rgba(255,255,255,0.55); display: flex; gap: 12px; flex-wrap: wrap; }
    .event-card h3 { font-size: 18px; line-height: 1.3; }
    .event-card .desc { font-size: 14px; color: rgba(255,255,255,0.7); }
    .event-card .cta { margin-top: auto; background: #fff; color: #0b0b0d; padding: 12px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 14px; transition: background .2s; }
    .event-card .cta:hover { background: #ff3366; color: #fff; }
    .empty-state { background: #15151a; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 40px; text-align: center; color: rgba(255,255,255,0.7); }
    .empty-state .cta-secondary { display: inline-block; margin-top: 16px; color: #ff3366; font-weight: 600; }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
    @media (max-width: 800px) { .about-grid { grid-template-columns: 1fr; } }
    .about-grid img { border-radius: 16px; }
    .faq-item { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 20px 0; }
    .faq-item h3 { font-size: 17px; margin-bottom: 8px; }
    .faq-item p { color: rgba(255,255,255,0.7); }
    .site-footer { margin-top: 80px; padding: 40px 24px; border-top: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; }
    .site-footer a { color: #ff3366; }
  </style>
</head>
<body>
${TRACKING_NOSCRIPT}

  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="site-logo">
        <img src="https://boombastic-events.b-cdn.net/The2PMCLUB-Website/57926c83-5a73-43e4-b501-9f9c758534fd_fs7hwi.png" alt="Boombastic Events">
      </a>
      <nav class="primary-nav">
        <a href="/locations/bedford/"${cityCfg.citySlug === 'bedford' ? ' class="active"' : ''}>Bedford</a>
        <a href="/locations/luton/"${cityCfg.citySlug === 'luton' ? ' class="active"' : ''}>Luton</a>
        <a href="/locations/coventry/"${cityCfg.citySlug === 'coventry' ? ' class="active"' : ''}>Coventry</a>
        <a href="/locations/milton-keynes/"${cityCfg.citySlug === 'milton-keynes' ? ' class="active"' : ''}>MK</a>
        <a href="/locations/northampton/"${cityCfg.citySlug === 'northampton' ? ' class="active"' : ''}>Northampton</a>
      </nav>
      <a href="/#tickets" class="book-cta">Book Tickets</a>
    </div>
  </header>

  <section class="hero">
    <div class="eyebrow">${esc(cityCfg.cityName)}</div>
    <h1>${events.length ? `Daytime Disco &amp; Live Events in ${esc(cityCfg.cityName)}` : `Events in ${esc(cityCfg.cityName)}`}</h1>
    <p>${esc(cityCfg.heroSubhead)}</p>
  </section>

  <section class="section" id="events">${renderEventsSection(events, cityCfg.cityName)}
  </section>

  ${renderAboutSection(cityCfg, heroImage)}

  ${renderFaqSection(cityCfg)}

  <footer class="site-footer">
    <p>© Boombastic Events. <a href="/">Back to home</a></p>
  </footer>

</body>
</html>
`;
}

// --- main ---
function main() {
  const events = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8'));
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const today = todayISO();

  const allEvents = Array.isArray(events) ? events : (events.events || []);

  let totalWritten = 0;
  let totalSkipped = 0;
  const summary = [];

  for (const cityCfg of cfg.cities) {
    const cityEvents = allEvents
      .filter(e => {
        if (!e.start) return false;
        const startsAt = parseStart(e.start);
        return startsAt >= today && (e.city || '').toLowerCase() === cityCfg.cityName.toLowerCase();
      })
      .sort((a, b) => parseStart(a.start) - parseStart(b.start));

    const html = renderHTML(cityCfg, cityEvents);
    const dir = path.join(OUT_DIR, cityCfg.citySlug);
    ensureDir(dir);
    const outPath = path.join(dir, 'index.html');

    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    if (existing === html) {
      totalSkipped++;
      summary.push(`  - ${cityCfg.citySlug}: unchanged (${cityEvents.length} events)`);
    } else {
      fs.writeFileSync(outPath, html, 'utf8');
      totalWritten++;
      summary.push(`  ✓ ${cityCfg.citySlug}: written (${cityEvents.length} events)`);
    }
  }

  console.log(`Location pages regenerated`);
  console.log(`  written: ${totalWritten}`);
  console.log(`  unchanged: ${totalSkipped}`);
  console.log(``);
  summary.forEach(s => console.log(s));
}

main();
