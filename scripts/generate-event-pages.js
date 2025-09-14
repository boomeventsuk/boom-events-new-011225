/* Event page generator — styled version with site header, poster image, CTAs, OG/Twitter, JSON-LD, sitemap + report
   Reads:
     - public/events.json
     - content/event-copy.json (optional; extra blurbs by id or slug)
   Writes:
     - public/events/<slug>/index.html
     - public/sitemap.xml
     - public/geo-seo-validation-report.md
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || 'https://boomevents.co.uk';

// ------- helpers -------
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{ recursive:true }); }
function readJson(p){ if(!fs.existsSync(p)) return null; try{ return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
function slugify(s){ return (s||'').toString().toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function withUkOffset(iso){
  if(!iso) return iso;
  if(/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) return iso; // already has tz
  const m = Number(iso.slice(5,7));
  return iso + ((m >= 4 && m <= 10) ? '+01:00' : '+00:00'); // Apr–Oct BST, else GMT
}
function splitVenueCity(loc){
  if(!loc) return { venue:'', city:'' };
  const parts = loc.split(',');
  const city  = parts.length>1 ? parts.at(-1).trim() : '';
  const venue = parts.length>1 ? parts.slice(0,-1).join(',').trim() : (parts[0]||'').trim();
  return { venue, city };
}
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ------- template -------
function buildEventHtml(ev, desc, slug){
  const { venue, city } = splitVenueCity(ev.location || '');
  const start = withUkOffset(ev.start || '');
  const end   = withUkOffset(ev.end   || '');
  const share = `${SITE_URL}/events/${slug}/`;
  const img   = ev.image ? (ev.image.startsWith('http') ? ev.image : SITE_URL + ev.image) : '';

  // Offer: include numeric price only; omit if unknown
  const offers = { "@type":"Offer", "url": ev.bookUrl || "", "priceCurrency":"GBP", "availability":"https://schema.org/InStock" };
  if (ev.price !== undefined && ev.price !== null && !isNaN(Number(ev.price))) offers.price = Number(ev.price);

  // JSON-LD
  const eventSD = {
    "@context":"https://schema.org",
    "@type":"Event",
    "name": ev.title || '',
    "startDate": start,
    "endDate": end,
    "eventStatus":"https://schema.org/EventScheduled",
    "eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",
    "location": { "@type":"Place", "name": venue || (ev.location||''), "address": { "@type":"PostalAddress", "addressLocality": city || '', "addressCountry":"GB" } },
    "image": img,
    "description": desc || ev.description || '',
    "organizer": { "@type":"Organization", "name":"Boombastic", "url": SITE_URL },
    "offers": offers
  };
  const breadcrumb = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item": SITE_URL + "/"},
      {"@type":"ListItem","position":2,"name":"Events","item": SITE_URL + "/events/"},
      {"@type":"ListItem","position":3,"name": ev.title || 'Event', "item": share}
    ]
  };

  // OG/Twitter
  const shortDesc = esc((desc || ev.description || '').slice(0,200));
  const safeTitle = esc(ev.title || '');

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

  // Readable date/time
  const d = ev.start ? new Date(ev.start) : null;
  const e = ev.end   ? new Date(ev.end)   : null;
  const date = d ? d.toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'}) : '';
  const st   = d ? d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';
  const et   = e ? e.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';

  // HTML page with header + navigation + tailwind styles
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
  <!-- Header / Nav (matches homepage) -->
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
      <!-- Poster / hero -->
      <div>
        ${img ? `<img src="${img}" alt="${safeTitle} poster" class="w-full h-auto rounded-xl shadow-lg" loading="eager" decoding="async" fetchpriority="high">` : ``}
      </div>

      <!-- Details / CTAs -->
      <aside class="space-y-5">
        <h1 class="text-3xl md:text-4xl font-bold leading-tight">${safeTitle}</h1>
        <p class="text-[var(--muted)]">${esc(desc || ev.description || '')}</p>

        <div class="space-y-2 text-sm">
          ${date ? `<p><strong>📆 Date:</strong> ${date}</p>` : ``}
          ${st ? `<p><strong>🕗 Time:</strong> ${st}${et?`–${et}`:''}</p>` : ``}
          <p><strong>📍 Venue:</strong> ${esc(venue || (ev.location||''))}${city?`, ${esc(city)}`:''}</p>
        </div>

        <div class="flex flex-col gap-3">
          ${ev.bookUrl ? `<a class="btn-primary text-center" href="${ev.bookUrl}" target="_blank" rel="noopener">🎫 Book Now</a>` : ``}
          ${ev.infoUrl ? `<a class="btn-secondary text-center" href="${ev.infoUrl}" target="_blank" rel="noopener">ℹ️ Event Info</a>` : ``}
          <a class="btn-secondary text-center" href="/#tickets">⬅︎ Back to Tickets</a>
        </div>

        <div class="text-xs text-[var(--muted)] pt-2">Share</div>
        <div class="flex gap-3 text-sm">
          <a class="underline" href="https://wa.me/?text=${encodeURIComponent(safeTitle+' — '+share)}" target="_blank" rel="noopener">WhatsApp</a>
          <a class="underline" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share)}" target="_blank" rel="noopener">Facebook</a>
          <a class="underline" href="${share}" onclick="navigator.clipboard?.writeText('${share}'); return false;">Copy link</a>
        </div>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

// ------- main -------
(function run(){
  const events = readJson(path.join(ROOT,'public','events.json')) || [];
  const copy   = readJson(path.join(ROOT,'content','event-copy.json')) || {};
  const outDir = path.join(ROOT,'public','events'); ensureDir(outDir);

  const sitemapUrls = new Set([`${SITE_URL}/`, `${SITE_URL}/tickets`, `${SITE_URL}/events`]);
  const sample = [];

  events.forEach(ev=>{
    const slug = ev.slug || slugify(ev.title || ev.id || 'event');
    const desc = copy[String(ev.id)] || copy[slug] || ev.description || '';
    const html = buildEventHtml(ev, desc, slug);
    const dir  = path.join(outDir, slug); ensureDir(dir);
    fs.writeFileSync(path.join(dir,'index.html'), html, 'utf8');
    sitemapUrls.add(`${SITE_URL}/events/${slug}/`);

    // quick validation flags
    const tzOk = /"startDate"\s*:\s*".+?[+\-]\d{2}:\d{2}"/.test(html);
    const offersUrlOk = /"offers"\s*:\s*{[^}]*"url"\s*:\s*".+?"/.test(html);
    const priceNumeric = /"offers"\s*:\s*{[^}]*"price"\s*:\s*\d+/.test(html);
    sample.push({ slug, tzOk, offersUrlOk, priceNumeric });
  });

  // sitemap
  ensureDir(path.join(ROOT,'public'));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...sitemapUrls].map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT,'public','sitemap.xml'), sitemap, 'utf8');

  // validation report
  const lines = [];
  lines.push('# GEO/SEO Styled Generation Report','');
  lines.push(`Pages generated: ${events.length}`,'');
  sample.slice(0,20).forEach(s => lines.push(`- ${s.slug}: timezone=${s.tzOk}, offersUrl=${s.offersUrlOk}, priceNumeric=${s.priceNumeric}`));
  fs.writeFileSync(path.join(ROOT,'public','geo-seo-validation-report.md'), lines.join('\n'), 'utf8');

  console.log('Styled event pages generated; sitemap & report written.');
})();
