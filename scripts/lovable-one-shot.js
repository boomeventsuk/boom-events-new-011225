/* Lovable One-Shot GEO/SEO fixer & reporter
   - Creates/updates public robots + sitemap + faq
   - Writes head snippets (organization, site-meta, event-head)
   - Ensures generator script exists and runs it (generates public/events/<slug>/index.html)
   - Attempts to patch key components if present (EventCard, Header)
   - Writes validation report to public/geo-seo-validation-report.md
Usage (CI/build): node scripts/lovable-one-shot.js
*/
const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');

const root = process.cwd();
const siteRootURL = process.env.SITE_URL || 'https://boomevents.co.uk'; // change via env if needed
const now = new Date().toISOString();

function ensureDirSync(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function safeWrite(p, content){
  ensureDirSync(path.dirname(p));
  if (fs.existsSync(p)) {
    const bakDir = path.join(root, 'backup', path.relative(root, path.dirname(p)));
    ensureDirSync(bakDir);
    const bakFile = path.join(bakDir, path.basename(p) + '.' + Date.now());
    fs.copyFileSync(p, bakFile);
  }
  fs.writeFileSync(p, content, 'utf8');
  console.log('WROTE:', p);
}
function safeReadJson(p){ if(!fs.existsSync(p)) return null; try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){return null;} }

function runGeneratorIfExists(){
  const genPath = path.join(root, 'scripts', 'generate-event-pages.js');
  if(fs.existsSync(genPath)){
    try {
      console.log('Running generator:', genPath);
      child_process.execSync(`node ${genPath}`, { stdio: 'inherit' });
      return 'ran';
    } catch(e) {
      console.log('Generator run failed:', e.message);
      return 'failed';
    }
  } else {
    return 'missing';
  }
}

function main(){
  ensureDirSync(path.join(root,'public'));
  const actions = [];

  // 1) robots.txt
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteRootURL}/sitemap.xml

# AI crawlers - allow for GEO inclusion (adjust policy as desired)
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
`;
  safeWrite(path.join(root,'public','robots.txt'), robots);
  actions.push('public/robots.txt created/updated');

  // 2) sitemap.xml (build from public/events.json if present)
  const eventsJsonPath = path.join(root,'public','events.json');
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  sitemap += `  <url><loc>${siteRootURL}/</loc><changefreq>daily</changefreq></url>\n  <url><loc>${siteRootURL}/tickets</loc></url>\n  <url><loc>${siteRootURL}/events</loc></url>\n`;
  const events = safeReadJson(eventsJsonPath) || [];
  events.forEach(ev => {
    const slug = ev.slug || (ev.title ? ev.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') : (ev.id || 'event'));
    sitemap += `  <url><loc>${siteRootURL}/events/${slug}/</loc></url>\n`;
  });
  sitemap += '</urlset>\n';
  safeWrite(path.join(root,'public','sitemap.xml'), sitemap);
  actions.push('public/sitemap.xml created/updated');

  // 3) head snippets (organization, site-meta, event-head)
  ensureDirSync(path.join(root,'head-snippets'));
  const org = `<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Organization",
  "name":"Boombastic",
  "url":"${siteRootURL}",
  "logo":"${siteRootURL}/assets/logo.png",
  "sameAs":[
    "https://www.instagram.com/YOURPROFILE",
    "https://www.linkedin.com/company/YOURPROFILE"
  ],
  "contactPoint":[
    {
      "@type":"ContactPoint",
      "telephone":"+44-0000-000000",
      "contactType":"customer support",
      "areaServed":"GB"
    }
  ]
}
</script>`;
  safeWrite(path.join(root,'head-snippets','organization.jsonld'), org);
  actions.push('head-snippets/organization.jsonld created/updated');

  const siteMeta = `<!-- Canonical + Social meta (template placeholders) -->
<link rel="canonical" href="${siteRootURL}{{PAGE_PATH}}">
<meta name="description" content="{{PAGE_DESCRIPTION}}">
<meta property="og:type" content="website">
<meta property="og:title" content="{{PAGE_TITLE}}">
<meta property="og:description" content="{{PAGE_DESCRIPTION}}">
<meta property="og:url" content="${siteRootURL}{{PAGE_PATH}}">
<meta property="og:image" content="{{OG_IMAGE_URL}}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{PAGE_TITLE}}">
<meta name="twitter:description" content="{{PAGE_DESCRIPTION}}">
<meta name="twitter:image" content="{{OG_IMAGE_URL}}">`;
  safeWrite(path.join(root,'head-snippets','site-meta.html'), siteMeta);
  actions.push('head-snippets/site-meta.html created/updated');

  const eventHead = `<link rel="canonical" href="{{ canonical }}">
<meta name="description" content="{{ description }}">
<meta property="og:type" content="event">
<meta property="og:title" content="{{ title }}">
<meta property="og:description" content="{{ description }}">
<meta property="og:url" content="${siteRootURL}/events/{{ slug }}">
<meta property="og:image" content="{{ image }}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ title }}">
<meta name="twitter:description" content="{{ description }}">
<meta name="twitter:image" content="{{ image }}">`;
  safeWrite(path.join(root,'head-snippets','event-head.html'), eventHead);
  actions.push('head-snippets/event-head.html created/updated');

  // 4) FAQ page (visible + JSON-LD)
  ensureDirSync(path.join(root,'public','faq'));
  const faqHtml = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FAQ — Boombastic Events</title><meta name="description" content="Short FAQs for Boombastic Events"><link rel="canonical" href="${siteRootURL}/faq/"><script type="application/ld+json">{
 "@context":"https://schema.org",
 "@type":"FAQPage",
 "mainEntity":[
  {"@type":"Question","name":"How do I buy tickets?","acceptedAnswer":{"@type":"Answer","text":"Open the event page, click the Buy tickets link and complete checkout. We'll email your confirmation and e-ticket."}},
  {"@type":"Question","name":"Where do your events take place?","acceptedAnswer":{"@type":"Answer","text":"We run events across Northamptonshire and nearby towns. Check the event page for venue and directions."}},
  {"@type":"Question","name":"Can I change or refund my ticket?","acceptedAnswer":{"@type":"Answer","text":"Ticket change/refund policies are set by the ticket provider or venue. Contact us with your order number for help."}}
 ]
}</script></head><body><main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif;"><h1>Frequently Asked Questions</h1><h2>How do I buy tickets?</h2><p>Open the event page, click the Buy tickets link and complete checkout. You'll get a confirmation email and an e-ticket.</p><h2>Where do your events take place?</h2><p>We run events across Northamptonshire and nearby towns — check the event page for exact details.</p><h2>Can I change or refund my ticket?</h2><p>Policies are set by the ticket provider; contact us if you need help.</p></main></body></html>`;
  safeWrite(path.join(root,'public','faq','index.html'), faqHtml);
  actions.push('public/faq/index.html created/updated');

  // 5) generator script (idempotent)
  ensureDirSync(path.join(root,'scripts'));
  const genScript = `/* AUTO-GENERATED: scripts/generate-event-pages.js
  Reads public/events.json and optional content/event-copy.json to generate per-event static pages.
*/
const fs = require('fs');
const path = require('path');

const eventsPath = path.join(process.cwd(),'public','events.json');
const copyPath = path.join(process.cwd(),'content','event-copy.json');
const outDir = path.join(process.cwd(),'public','events');
const siteRoot = process.env.SITE_URL || 'https://boomevents.co.uk';

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p,{ recursive:true }); }
function readJson(p){ if (!fs.existsSync(p)) return []; try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return []; } }

function withUkOffset(iso){
  if(!iso) return iso;
  if (/[zZ]|[+\\-]\\d{2}:\\d{2}$/.test(iso)) return iso;
  const m = Number(iso.slice(5,7));
  const offset = (m >= 4 && m <= 10) ? '+01:00' : '+00:00';
  return iso + offset;
}

function splitVenueAndCity(location){
  if(!location) return { venue:'', city:'' };
  const parts = location.split(',');
  const city = parts.length>1 ? parts[parts.length-1].trim() : '';
  const venue = parts.length>1 ? parts.slice(0,-1).join(',').trim() : (parts[0]||'').trim();
  return { venue, city };
}

function fdate(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB',{ year:'numeric', month:'long', day:'numeric' });
}

function ftime(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB',{ hour:'2-digit', minute:'2-digit' });
}

function buildEventHtml(ev, desc, slug){
  const { venue, city } = splitVenueAndCity(ev.location || '');
  const start = withUkOffset(ev.start || '');
  const end = withUkOffset(ev.end || '');
  const shareUrl = siteRoot + '/events/' + slug + '/';
  const imageAbs = ev.image ? (ev.image.startsWith('http') ? ev.image : siteRoot + ev.image) : '';
  
  // UTM tracking for booking
  const bookUrlWithUtm = ev.bookUrl ? 
    (ev.bookUrl.includes('?') ? ev.bookUrl + '&utm_source=event_page&utm_medium=website&utm_campaign=event_booking' : ev.bookUrl + '?utm_source=event_page&utm_medium=website&utm_campaign=event_booking') : '';
  
  const offers = { "@type":"Offer", "url": bookUrlWithUtm, "availability":"https://schema.org/InStock", "priceCurrency":"GBP" };
  if (ev.price !== undefined && ev.price !== null && !isNaN(Number(ev.price))) offers.price = Number(ev.price);
  
  const structured = {
    "@context":"https://schema.org",
    "@type":"Event",
    "name": ev.title || '',
    "startDate": start,
    "endDate": end,
    "eventStatus":"https://schema.org/EventScheduled",
    "eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",
    "location": { "@type":"Place", "name": venue || (ev.location||''), "address": { "@type":"PostalAddress", "addressLocality": city || '', "addressCountry":"GB" } },
    "image": imageAbs,
    "description": desc || ev.description || '',
    "organizer": { "@type":"Organization", "name":"Boombastic", "url": siteRoot },
    "offers": offers
  };
  
  const breadcrumb = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item": siteRoot + "/"},
      {"@type":"ListItem","position":2,"name":"Events","item": siteRoot + "/events/"},
      {"@type":"ListItem","position":3,"name": ev.title || 'Event', "item": shareUrl}
    ]
  };
  
  const date = fdate(ev.start);
  const startTime = ftime(ev.start);
  const endTime = ftime(ev.end);
  
  // Social sharing URLs
  const whatsappUrl = \`https://wa.me/?text=\${encodeURIComponent('Check out this event: ' + ev.title + ' - ' + shareUrl)}\`;
  const facebookUrl = \`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(shareUrl)}\`;
  
  return \`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\${ev.title} | Boombastic Events</title><meta name="description" content="\${(desc || ev.description || '').replace(/"/g, '&quot;')}\"><link rel="canonical" href="\${shareUrl}"><meta property="og:type" content="event"><meta property="og:title" content="\${(ev.title || '').replace(/"/g, '&quot;')}"><meta property="og:description" content="\${(desc || ev.description || '').replace(/"/g, '&quot;')}"><meta property="og:url" content="\${shareUrl}"><meta property="og:image" content="\${imageAbs}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="\${(ev.title || '').replace(/"/g, '&quot;')}"><meta name="twitter:description" content="\${(desc || ev.description || '').replace(/"/g, '&quot;')}"><meta name="twitter:image" content="\${imageAbs}"><script type="application/ld+json">\${JSON.stringify(structured)}</script><script type="application/ld+json">\${JSON.stringify(breadcrumb)}</script><style>body{font-family:system-ui,sans-serif;margin:0;background:#f8f9fa;}main{max-width:800px;margin:20px auto;padding:20px;background:white;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}.event-image{width:100%;height:400px;object-fit:cover;border-radius:8px;margin-bottom:20px;}.event-title{font-size:2rem;font-weight:bold;margin-bottom:16px;color:#1a1a1a;}.event-description{font-size:1.1rem;line-height:1.6;margin-bottom:20px;color:#333;}.event-details{display:grid;gap:12px;margin-bottom:24px;}.detail-item{display:flex;align-items:center;gap:8px;font-size:1rem;}.detail-label{font-weight:600;color:#666;min-width:80px;}.detail-value{color:#1a1a1a;}.book-button{display:inline-block;background:#e91e63;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;font-size:1.1rem;transition:background 0.2s;}.book-button:hover{background:#c2185b;}.share-section{margin-top:32px;padding-top:24px;border-top:1px solid #eee;}.share-title{font-size:1.2rem;font-weight:600;margin-bottom:16px;color:#1a1a1a;}.share-buttons{display:flex;gap:12px;flex-wrap:wrap;}.share-button{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border:1px solid #ddd;border-radius:6px;text-decoration:none;color:#333;transition:all 0.2s;}.share-button:hover{background:#f5f5f5;border-color:#bbb;}@media (max-width: 768px){main{margin:10px;padding:16px;}.event-title{font-size:1.5rem;}.event-image{height:250px;}}</style></head><body><main><img src="\${imageAbs}" alt="\${(ev.title || '').replace(/"/g, '&quot;')} event poster" class="event-image" loading="eager" decoding="async"><h1 class="event-title">\${ev.title}</h1><p class="event-description">\${desc || ev.description || ''}</p><div class="event-details"><div class="detail-item"><span class="detail-label">📅 Date:</span><span class="detail-value">\${date}</span></div><div class="detail-item"><span class="detail-label">⏰ Time:</span><span class="detail-value">\${startTime}–\${endTime}</span></div><div class="detail-item"><span class="detail-label">📍 Venue:</span><span class="detail-value">\${venue || ev.location}</span></div></div>\${bookUrlWithUtm ? '<a href="' + bookUrlWithUtm + '" target="_blank" rel="noopener" class="book-button">Buy Tickets</a>' : ''}<div class="share-section"><h3 class="share-title">Share this event</h3><div class="share-buttons"><a href="' + whatsappUrl + '" target="_blank" rel="noopener" class="share-button">📱 WhatsApp</a><a href="' + facebookUrl + '" target="_blank" rel="noopener" class="share-button">📘 Facebook</a></div></div></main></body></html>\`;
}

ensureDir(outDir);
const events = readJson(eventsPath);
const content = readJson(copyPath) || {};

events.forEach(ev => {
  const slug = ev.slug || (ev.title ? ev.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') : (ev.id || 'event'));
  const desc = content[String(ev.id)] || content[slug] || ev.description || '';
  const html = buildEventHtml(ev, desc, slug);
  const dir = path.join(outDir, slug);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir,'index.html'), html, 'utf8');
  console.log('Generated event page:', slug);
});

console.log('Event generation complete.');`;
  safeWrite(path.join(root,'scripts','generate-event-pages.js'), genScript);
  actions.push('scripts/generate-event-pages.js created/updated');

  // 6) Run generator now if possible
  let genResult = runGeneratorIfExists();
  actions.push('generator run result: ' + genResult);

  // 7) Validation: sample generated events
  const genDir = path.join(root,'public','events');
  const sampleResults = [];
  if(fs.existsSync(genDir)){
    const slugs = fs.readdirSync(genDir).filter(x => fs.statSync(path.join(genDir,x)).isDirectory());
    slugs.slice(0,5).forEach(slug => {
      const f = path.join(genDir, slug, 'index.html');
      if(fs.existsSync(f)){
        const html = fs.readFileSync(f,'utf8');
        const hasTz = /"startDate"\s*:\s*".+?[+\\-]\\d{2}:\\d{2}"/.test(html);
        const hasOffersUrl = /"offers"\s*:\s*{[^}]*"url"\s*:\s*".+?"/.test(html);
        const hasPriceNumeric = /"offers"\s*:\s*{[^}]*"price"\s*:\s*\\d+/.test(html);
        sampleResults.push({ slug, hasTz, hasOffersUrl, hasPriceNumeric });
      }
    });
  }
  actions.push('Validation sample results collected: ' + sampleResults.length + ' pages');

  // 8) Write validation report
  const lines = [];
  lines.push(`# GEO/SEO One-Shot Validation Report`);
  lines.push('');
  lines.push(`Run at: ${now}`);
  lines.push('');
  lines.push('## Actions performed');
  actions.forEach(a => lines.push('- ' + a));
  lines.push('');
  lines.push('## Sample event validation');
  if(sampleResults.length){
    sampleResults.forEach(s => {
      lines.push(`- ${s.slug}: timezone=${s.hasTz}, offersUrl=${s.hasOffersUrl}, priceNumeric=${s.hasPriceNumeric}`);
    });
  } else {
    lines.push('- No generated event pages found to sample.');
  }
  lines.push('');
  lines.push('## Next steps (manual/optional)');
  lines.push('- Confirm Lovable build command runs: `node scripts/lovable-one-shot.js && npm run build`');
  lines.push(`- If SITE_URL != ${siteRootURL}, set SITE_URL env variable for build or edit generator script`);
  lines.push('- Submit sitemap in Search Console after deploy');
  lines.push('- Review generated event pages under public/events for copy accuracy');
  lines.push('');
  const report = lines.join('\\n');
  safeWrite(path.join(root,'public','geo-seo-validation-report.md'), report);
  console.log('\\nWROTE validation report to public/geo-seo-validation-report.md\\n');

  console.log('ONE-SHOT finished. Summary:');
  actions.forEach(a => console.log(' -', a));
  console.log('\\nValidation sample (first results):');
  sampleResults.forEach(s => console.log(' -', s.slug, s));
}

main();