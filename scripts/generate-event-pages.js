// build marker (ESM) — remove after test
import fs from 'fs';
import path from 'path';
try {
  const out = path.join(process.cwd(), 'public', '.generator_marker.txt');
  await fs.promises.mkdir(path.dirname(out), { recursive: true });
  await fs.promises.writeFile(out, `ran-file: scripts/generate-event-pages.js\ntimestamp: ${new Date().toISOString()}\n`, 'utf8');
} catch (e) {
  // continue silently
}

/* V2 generator: per-event static pages with clean JSON-LD + OG/Twitter meta + optional FAQ + sitemap + report
   Reads:
     - public/events.json
     - content/event-copy.json (optional; extra blurbs by id or slug)
     - content/event-faq.json  (optional; per-event FAQs by slug or id: [{q,a},{q,a},...])
   Writes:
     - public/events/<slug>/index.html
     - public/sitemap.xml
     - public/geo-seo-validation-report.md
*/

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || 'https://boomevents.co.uk';

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{ recursive:true }); }
function readJson(p){ if(!fs.existsSync(p)) return null; try{ return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
function slugify(s){ return (s||'').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function withUkOffset(iso){
  if(!iso) return iso;
  if(/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) return iso;
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
function faqJsonLd(qas){
  if (!qas || !qas.length) return null;
  const mainEntity = qas.slice(0,8).map(({q,a}) => ({
    "@type":"Question",
    "name": q,
    "acceptedAnswer": { "@type":"Answer", "text": a }
  }));
  return { "@context":"https://schema.org", "@type":"FAQPage", "mainEntity": mainEntity };
}
function faqHtml(qas){
  if (!qas || !qas.length) return '';
  const items = qas.slice(0,8).map(({q,a}) => `<h3>${q}</h3><p>${a}</p>`).join('');
  return `<section id="faq" style="margin-top:24px"><h2>Event FAQs</h2>${items}</section>`;
}
function buildEventHtml(ev, desc, slug, qas){
  const { venue, city } = splitVenueCity(ev.location || '');
  const start = withUkOffset(ev.start || '');
  const end   = withUkOffset(ev.end   || '');
  const share = `${SITE_URL}/events/${slug}/`;
  const img   = ev.image ? (ev.image.startsWith('http') ? ev.image : SITE_URL + ev.image) : '';

  const offers = { "@type":"Offer", "url": ev.bookUrl || "", "priceCurrency":"GBP", "availability":"https://schema.org/InStock" };
  if (ev.price !== undefined && ev.price !== null && !isNaN(Number(ev.price))) offers.price = Number(ev.price);

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
  const faqSD = faqJsonLd(qas);

  const shortDesc = (desc || ev.description || '').slice(0,200).replace(/"/g,'&quot;');
  const safeTitle = (ev.title||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

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

  const d = ev.start ? new Date(ev.start) : null, e = ev.end ? new Date(ev.end) : null;
  const date = d ? d.toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'}) : '';
  const st   = d ? d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';
  const et   = e ? e.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})   : '';

  return `<!doctype html><html lang="en-GB"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle} | Boombastic</title>
<meta name="description" content="${shortDesc}">
<link rel="canonical" href="${share}">
${og}
<script type="application/ld+json">${JSON.stringify(eventSD)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
${faqSD ? `<script type="application/ld+json">${JSON.stringify(faqSD)}</script>` : ''}
</head><body>
<main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif">
  <h1>${safeTitle}</h1>
  <p>${desc || ev.description || ''}</p>
  ${ev.start ? `<p><strong>Date:</strong> ${date} <strong>Time:</strong> ${st}${et ? `–${et}`:''}</p>` : ''}
  <p><strong>Venue:</strong> ${venue || (ev.location||'')}</p>
  ${ev.bookUrl ? `<p><a href="${ev.bookUrl}" target="_blank" rel="noopener">Buy tickets</a></p>` : ''}
  ${faqHtml(qas)}
</main></body></html>`;
}
function buildSitemap(urls){
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`; }

(async function run(){
  const events = readJson(path.join(ROOT,'public','events.json')) || [];
  const copy   = readJson(path.join(ROOT,'content','event-copy.json')) || {};
  const faqMap = readJson(path.join(ROOT,'content','event-faq.json')) || {};
  const outDir = path.join(ROOT,'public','events'); ensureDir(outDir);

  const sitemapUrls = new Set([`${SITE_URL}/`, `${SITE_URL}/tickets`, `${SITE_URL}/events`]);
  const sample = [];

  events.forEach(ev=>{
    const slug = ev.slug || slugify(ev.title || ev.id || 'event');
    const desc = copy[String(ev.id)] || copy[slug] || ev.description || '';
    const qas  = faqMap[String(ev.id)] || faqMap[slug] || (faqMap["_default"] || []);
    const html = buildEventHtml(ev, desc, slug, qas);
    const dir  = path.join(outDir, slug); ensureDir(dir);
    fs.writeFileSync(path.join(dir,'index.html'), html, 'utf8');
    sitemapUrls.add(`${SITE_URL}/events/${slug}/`);

    // validation flags
    const tzOk = /"startDate"\s*:\s*".+?[+\-]\d{2}:\d{2}"/.test(html);
    const offersUrlOk = /"offers"\s*:\s*{[^}]*"url"\s*:\s*".+?"/.test(html);
    const priceNumeric = /"offers"\s*:\s*{[^}]*"price"\s*:\s*\d+/.test(html);
    const hasFaq = /"@type":"FAQPage"/.test(html);
    sample.push({ slug, tzOk, offersUrlOk, priceNumeric, hasFaq });
  });

  // write sitemap.xml
  ensureDir(path.join(ROOT,'public'));
  fs.writeFileSync(path.join(ROOT,'public','sitemap.xml'), buildSitemap([...sitemapUrls]), 'utf8');

  // write validation report
  const lines = [];
  lines.push('# GEO/SEO Generation Report (V2)','');
  lines.push(`Pages generated: ${events.length}`,'','## Sample validation (first 20)');
  sample.slice(0,20).forEach(s => lines.push(`- ${s.slug}: timezone=${s.tzOk}, offersUrl=${s.offersUrlOk}, priceNumeric=${s.priceNumeric}, faq=${s.hasFaq}`));
  lines.push('','## Notes','- Timezone added (+01:00 Apr–Oct, else +00:00).','- Non-numeric prices omitted (no "TBA" in JSON-LD).','- Venue in location.name; city in addressLocality.','- OG/Twitter meta injected.','- Optional per-event FAQ included when available.');
  fs.writeFileSync(path.join(ROOT,'public','geo-seo-validation-report.md'), lines.join('\n'), 'utf8');

  console.log('V2: Generated pages, rebuilt sitemap, wrote validation report.');
})();
