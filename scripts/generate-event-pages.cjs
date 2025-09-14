/* Generate per-event static pages with clean JSON-LD + sitemap + a validation report.
   Reads: public/events.json
   Optional: content/event-copy.json (extra blurbs by id or slug)
   Writes: public/events/<slug>/index.html
           public/sitemap.xml
           public/geo-seo-validation-report.md
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_URL = process.env.SITE_URL || 'https://boomevents.co.uk';

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{ recursive:true }); }
function readJson(p){ if(!fs.existsSync(p)) return null; try{ return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
function slugify(s){ return (s||'').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function withUkOffset(iso){
  if(!iso) return iso;
  if(/[zZ]|[+-]\d{2}:\d{2}$/.test(iso)) return iso; // already has tz
  const m = Number(iso.slice(5,7));
  return iso + ((m >= 4 && m <= 10) ? '+01:00' : '+00:00'); // Apr–Oct BST, else GMT
}
function splitVenueCity(loc){
  if(!loc) return { venue:'', city:'' };
  const parts = loc.split(',');
  const city = parts.length>1 ? parts.at(-1).trim() : '';
  const venue = parts.length>1 ? parts.slice(0,-1).join(',').trim() : (parts[0]||'').trim();
  return { venue, city };
}
function eventHtml(ev, desc, slug){
  const { venue, city } = splitVenueCity(ev.location || '');
  const start = withUkOffset(ev.start || '');
  const end = withUkOffset(ev.end || '');
  const share = `${SITE_URL}/events/${slug}/`;
  const img = ev.image ? (ev.image.startsWith('http') ? ev.image : SITE_URL + ev.image) : '';

  const offers = { "@type":"Offer", "url": ev.bookUrl || "", "priceCurrency":"GBP", "availability":"https://schema.org/InStock" };
  if (ev.price !== undefined && ev.price !== null && !isNaN(Number(ev.price))) offers.price = Number(ev.price);

  const sd = {
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
  const bc = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item": SITE_URL + "/"},
      {"@type":"ListItem","position":2,"name":"Events","item": SITE_URL + "/events/"},
      {"@type":"ListItem","position":3,"name": ev.title || 'Event', "item": share}
    ]
  };

  const d = ev.start ? new Date(ev.start) : null, e = ev.end ? new Date(ev.end) : null;
  const date = d ? d.toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'}) : '';
  const st = d ? d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';
  const et = e ? e.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';

  return `<!doctype html><html lang="en-GB"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ev.title} | Boombastic</title>
<meta name="description" content="${(desc || ev.description || '').replace(/"/g,'&quot;')}">
<link rel="canonical" href="${share}">
<script type="application/ld+json">${JSON.stringify(sd)}</script>
<script type="application/ld+json">${JSON.stringify(bc)}</script>
</head><body>
<main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif">
<h1>${ev.title}</h1>
<p>${desc || ev.description || ''}</p>
${ev.start ? `<p><strong>Date:</strong> ${date} <strong>Time:</strong> ${st}${et ? `–${et}`:''}</p>` : ''}
<p><strong>Venue:</strong> ${venue || (ev.location||'')}</p>
${ev.bookUrl ? `<p><a href="${ev.bookUrl}" target="_blank" rel="noopener">Buy tickets</a></p>` : ''}
</main></body></html>`;
}
function buildSitemap(urls){
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
}

(function run(){
  const events = readJson(path.join(ROOT,'public','events.json')) || [];
  const copy = readJson(path.join(ROOT,'content','event-copy.json')) || {};
  const outDir = path.join(ROOT,'public','events'); ensureDir(outDir);

  const sitemapUrls = new Set([`${SITE_URL}/`, `${SITE_URL}/tickets`, `${SITE_URL}/events`]);
  const sample = [];

  events.forEach(ev=>{
    const slug = ev.slug || slugify(ev.title || ev.id || 'event');
    const desc = copy[String(ev.id)] || copy[slug] || ev.description || '';
    const html = eventHtml(ev, desc, slug);
    const dir = path.join(outDir, slug); ensureDir(dir);
    fs.writeFileSync(path.join(dir,'index.html'), html, 'utf8');
    sitemapUrls.add(`${SITE_URL}/events/${slug}/`);

    // validation flags
    const tzOk = /"startDate"\s*:\s*".+?[+\-]\d{2}:\d{2}"/.test(html);
    const offersUrlOk = /"offers"\s*:\s*{[^}]*"url"\s*:\s*".+?"/.test(html);
    const priceNumeric = /"offers"\s*:\s*{[^}]*"price"\s*:\s*\d+/.test(html);
    sample.push({ slug, tzOk, offersUrlOk, priceNumeric });
  });

  // rewrite sitemap.xml from the set
  ensureDir(path.join(ROOT,'public'));
  fs.writeFileSync(path.join(ROOT,'public','sitemap.xml'), buildSitemap([...sitemapUrls]), 'utf8');

  // write validation report
  const lines = [];
  lines.push('# GEO/SEO Generation Report','');
  lines.push(`Pages generated: ${events.length}`,'');
  lines.push('## Sample validation (first 20)');
  sample.slice(0,20).forEach(s => lines.push(`- ${s.slug}: timezone=${s.tzOk}, offersUrl=${s.offersUrlOk}, priceNumeric=${s.priceNumeric}`));
  lines.push('','## Notes','- Timezone added (+01:00 Apr–Oct, else +00:00).','- Non-numeric prices omitted (no "TBA" in JSON-LD).','- Venue in location.name; city in address.addressLocality.');
  fs.writeFileSync(path.join(ROOT,'public','geo-seo-validation-report.md'), lines.join('\n'), 'utf8');

  console.log('Generated pages, rebuilt sitemap, wrote validation report.');
})();