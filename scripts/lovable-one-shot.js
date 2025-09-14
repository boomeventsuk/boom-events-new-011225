/* Lovable One-Shot — GEO/SEO fixer, generator, reporter

Safe to run multiple times. Requires Node (common in CI).

It will:
- write robots/sitemap/faq/head snippets
- ensure generator exists and run it
- patch package.json (postinstall, build, generate:events)
- write public/geo-seo-validation-report.md
*/
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const root = process.cwd();
const SITE_URL = process.env.SITE_URL || 'https://boomevents.co.uk';
const now = new Date().toISOString();

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function readJson(p){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return null; } }
function writeFile(p, content){
  ensureDir(path.dirname(p));
  if (fs.existsSync(p)) {
    const bak = p + '.bak.' + Date.now();
    fs.copyFileSync(p, bak);
  }
  fs.writeFileSync(p, content, 'utf8');
}
function upsertPackageScripts(){
  const pkgPath = path.join(root,'package.json');
  const pkg = readJson(pkgPath) || {};
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts.postinstall) pkg.scripts.postinstall = 'node scripts/lovable-one-shot.js';
  if (!pkg.scripts['generate:events']) pkg.scripts['generate:events'] = 'node scripts/generate-event-pages.js';
  const build = pkg.scripts.build || 'vite build';
  if (!/generate:events/.test(build)) {
    pkg.scripts.build = `npm run generate:events && ${build}`;
  }
  writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  return true;
}
function simpleSlug(s){
  return (s||'').toString().toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function main(){
  const actions = [];

  // public/robots.txt
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml

# AI crawlers - allow for GEO/AEO inclusion
User-agent: GPTBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /
`;
  writeFile(path.join(root,'public','robots.txt'), robots);
  actions.push('robots.txt updated');

  // Build sitemap from public/events.json if present
  const eventsJson = readJson(path.join(root,'public','events.json')) || [];
  let urls = [
    `<url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq></url>`,
    `<url><loc>${SITE_URL}/tickets</loc></url>`,
    `<url><loc>${SITE_URL}/events</loc></url>`
  ];
  eventsJson.forEach(ev => {
    const slug = ev.slug || simpleSlug(ev.title||ev.id||'event');
    urls.push(`<url><loc>${SITE_URL}/events/${slug}/</loc></url>`);
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  writeFile(path.join(root,'public','sitemap.xml'), sitemap);
  actions.push(`sitemap.xml updated (${urls.length} urls)`);

  // Head snippets
  writeFile(path.join(root,'head-snippets','organization.jsonld'),
    `<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Organization",
  "name":"Boombastic",
  "url":"${SITE_URL}",
  "logo":"${SITE_URL}/assets/logo.png",
  "sameAs":[
    "https://www.instagram.com/boombastic_events",
    "https://www.facebook.com/BoombasticEvents"
  ],
  "contactPoint":[
    {
      "@type":"ContactPoint",
      "telephone":"+44-1234-567890",
      "contactType":"customer support",
      "areaServed":"GB"
    }
  ]
}
</script>`);
  actions.push('head-snippets/organization.jsonld ready');

  writeFile(path.join(root,'head-snippets','site-meta.html'),
    `<link rel="canonical" href="${SITE_URL}{{PAGE_PATH}}">
<meta name="description" content="{{PAGE_DESCRIPTION}}">
<meta property="og:type" content="website">
<meta property="og:title" content="{{PAGE_TITLE}}">
<meta property="og:description" content="{{PAGE_DESCRIPTION}}">
<meta property="og:url" content="${SITE_URL}{{PAGE_PATH}}">
<meta property="og:image" content="{{OG_IMAGE_URL}}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{PAGE_TITLE}}">
<meta name="twitter:description" content="{{PAGE_DESCRIPTION}}">
<meta name="twitter:image" content="{{OG_IMAGE_URL}}">`);
  actions.push('head-snippets/site-meta.html ready');

  writeFile(path.join(root,'head-snippets','event-head.html'),
    `<link rel="canonical" href="{{ canonical }}">
<meta name="description" content="{{ description }}">
<meta property="og:type" content="event">
<meta property="og:title" content="{{ title }}">
<meta property="og:description" content="{{ description }}">
<meta property="og:url" content="${SITE_URL}/events/{{ slug }}">
<meta property="og:image" content="{{ image }}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ title }}">
<meta name="twitter:description" content="{{ description }}">
<meta name="twitter:image" content="{{ image }}">`);
  actions.push('head-snippets/event-head.html ready');

  // FAQ (visible + JSON-LD)
  writeFile(path.join(root,'public','faq','index.html'),
    `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FAQ — Boombastic Events</title>
<meta name="description" content="Short FAQs about tickets, locations and support.">
<link rel="canonical" href="${SITE_URL}/faq/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage",
"mainEntity":[
{"@type":"Question","name":"How do I buy tickets?","acceptedAnswer":{"@type":"Answer","text":"Open the event page, click the Buy tickets link and complete checkout. We'll email your confirmation and e-ticket."}},
{"@type":"Question","name":"Where do your events take place?","acceptedAnswer":{"@type":"Answer","text":"We run events across Northamptonshire and nearby towns. Check the event page for venue and directions."}},
{"@type":"Question","name":"Can I change or refund my ticket?","acceptedAnswer":{"@type":"Answer","text":"Ticket policies are set by the provider/venue. Contact us with your order number for help."}}
]}</script></head>
<body><main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif">
<h1>Frequently Asked Questions</h1>
<h2>How do I buy tickets?</h2><p>Open the event page, click the Buy tickets link and complete checkout. You'll receive a confirmation email and e-ticket.</p>
<h2>Where do your events take place?</h2><p>We run events across Northamptonshire and nearby towns — check the event page for exact details.</p>
<h2>Can I change or refund my ticket?</h2><p>Policies are set by the ticket provider; contact us if you need help.</p>
</main></body></html>`);
  actions.push('public/faq/index.html ready');

  // Generator: write (no external deps)
  const generator = `/* scripts/generate-event-pages.js — generates public/events/<slug>/index.html with clean JSON-LD */
const fs = require('fs');
const path = require('path');
const SITE_URL = process.env.SITE_URL || '${SITE_URL}';

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function readJson(p){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return []; } }
function slug(s){ return (s||'').toString().toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function withUkOffset(iso){ if(!iso) return iso; if(/[zZ]|[+\\-]\\d{2}:\\d{2}$/.test(iso)) return iso; const m=Number(iso.slice(5,7)); const off=(m>=4&&m<=10)?'+01:00':'+00:00'; return iso+off; }
function splitVenueCity(loc){ if(!loc) return {venue:'',city:''}; const parts=loc.split(','); const city=parts.length>1?parts[parts.length-1].trim():''; const venue=parts.length>1?parts.slice(0,-1).join(',').trim():(parts[0]||'').trim(); return {venue,city}; }

function html(ev,desc,slugStr){
  const {venue,city}=splitVenueCity(ev.location||'');
  const start=withUkOffset(ev.start||'');
  const end=withUkOffset(ev.end||'');
  const share = SITE_URL + '/events/' + slugStr + '/';
  const img = ev.image ? (ev.image.startsWith('http')?ev.image: SITE_URL + ev.image) : '';
  const offers = {"@type":"Offer","url":ev.bookUrl||'',"availability":"https://schema.org/InStock","priceCurrency":"GBP"};
  if(ev.price!==undefined && ev.price!==null && !isNaN(Number(ev.price))) offers.price = Number(ev.price);
  const sd = {"@context":"https://schema.org","@type":"Event","name":ev.title||'',"startDate":start,"endDate":end,
    "eventStatus":"https://schema.org/EventScheduled","eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",
    "location":{"@type":"Place","name":venue || (ev.location||''),"address":{"@type":"PostalAddress","addressLocality":city||'',"addressCountry":"GB"}},
    "image":img,"description":desc||ev.description||'',"organizer":{"@type":"Organization","name":"Boombastic","url":SITE_URL},"offers":offers};
  const bc = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":SITE_URL+"/"},
    {"@type":"ListItem","position":2,"name":"Events","item":SITE_URL+"/events/"},
    {"@type":"ListItem","position":3,"name":ev.title||'Event',"item":share}]};
  const d = ev.start? new Date(ev.start): null;
  const e = ev.end? new Date(ev.end): null;
  const date = d? d.toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'}):'';
  const st = d? d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'';
  const et = e? e.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'';
  return \`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>\${ev.title} | Boombastic</title><meta name="description" content="\${desc||ev.description||''}">
<link rel="canonical" href="\${share}">
<script type="application/ld+json">\${JSON.stringify(sd)}</script>
<script type="application/ld+json">\${JSON.stringify(bc)}</script>
</head><body><main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif">
<h1>\${ev.title}</h1><p>\${desc||ev.description||''}</p>
<p><strong>Date:</strong> \${date} <strong>Time:</strong> \${st}–\${et}</p>
<p><strong>Venue:</strong> \${venue || (ev.location||'')}</p>
\${ev.bookUrl?'<p><a href="'+ev.bookUrl+'" target="_blank" rel="noopener">Buy tickets</a></p>':''}
</main></body></html>\`;
}

(function run(){
  const events = readJson(path.join(process.cwd(),'public','events.json'));
  const copy = readJson(path.join(process.cwd(),'content','event-copy.json')) || {};
  const outDir = path.join(process.cwd(),'public','events');
  if(!events || !Array.isArray(events)){ console.log('No events.json found'); return; }
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir,{recursive:true});
  events.forEach(ev=>{
    const s = ev.slug || slug(ev.title||ev.id||'event');
    const desc = copy[String(ev.id)] || copy[s] || ev.description || '';
    const htmlContent = html(ev,desc,s);
    const dir = path.join(outDir,s);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), htmlContent,'utf8');
    console.log('Generated:', s);
  });
  console.log('Event generation complete.');
})();`;
  writeFile(path.join(root,'scripts','generate-event-pages.js'), generator);
  actions.push('generator ready');

  // Run generator now (best effort)
  try {
    child_process.execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
    actions.push('generator executed');
  } catch(e) {
    actions.push('generator could not execute in this env (it will still run in build/postinstall)');
  }

  // Patch package.json scripts
  upsertPackageScripts();
  actions.push('package.json scripts patched (postinstall + generate:events + build)');

  // Validate a few generated pages
  const sample = [];
  const evDir = path.join(root,'public','events');
  if (fs.existsSync(evDir)) {
    const slugs = fs.readdirSync(evDir).filter(f => fs.statSync(path.join(evDir,f)).isDirectory()).slice(0,20);
    for (const s of slugs){
      const fp = path.join(evDir,s,'index.html');
      const html = fs.readFileSync(fp,'utf8');
      const tz = /"startDate"\s*:\s*".+?[+-]\d{2}:\d{2}"/.test(html);
      const offersUrl = /"offers"\s*:\s*{[^}]*"url"\s*:\s*".+?"/.test(html);
      const priceNumeric = /"offers"\s*:\s*{[^}]*"price"\s*:\s*\d+/.test(html);
      sample.push({slug:s, tz, offersUrl, priceNumeric});
    }
  }

  // Write validation report
  const report = [
    '# GEO/SEO One-Shot Validation Report',
    '',
    `Run at: ${now}`,
    '',
    '## Actions performed:',
    ...actions.map(a=>'- '+a),
    '',
    '## Sample event validation:',
    ...sample.map(s=>`- ${s.slug}: timezone=${s.tz}, offersUrl=${s.offersUrl}, priceNumeric=${s.priceNumeric}`),
    '',
    '## Next steps:',
    '- Ensure Lovable build command runs `npm run build` (which now runs generator before Vite).',
    '- Or rely on postinstall: this script also runs on `npm install`.',
    `- If SITE_URL is not ${SITE_URL}, set SITE_URL env var in Lovable or edit scripts.`,
    '- Submit sitemap in Search Console after deploy.',
  ].join('\n');
  writeFile(path.join(root,'public','geo-seo-validation-report.md'), report);
  console.log('Wrote public/geo-seo-validation-report.md');
}

main();