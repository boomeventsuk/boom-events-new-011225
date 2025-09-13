/*
 Lovable one-shot GEO/SEO fixer & reporter
 - Create public robots/sitemap/faq
 - Create head snippets
 - Optional: modify components if present (backed up)
 - Generate per-event static pages from public/events.json
 - Produce validation report at public/geo-seo-validation-report.md
 Usage (CI/build): node scripts/lovable-one-shot.js
*/
const fs = require('fs');
const path = require('path');
const os = require('os');

const root = process.cwd();
const log = console.log;
const now = new Date().toISOString();

function safeWriteFile(p, content) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(p)) {
    // backup existing file
    const backupDir = path.join(root, 'backup', path.relative(root, dir));
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, path.basename(p) + '.' + Date.now());
    fs.copyFileSync(p, backupFile);
  }
  fs.writeFileSync(p, content, 'utf8');
  return true;
}

function safeReadJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function exists(p) { return fs.existsSync(p); }

async function main() {
  const report = [];
  const actions = [];

  // Detect basic env capability
  try {
    const tmpTest = path.join(os.tmpdir(), `lovable_test_${Date.now()}.txt`);
    fs.writeFileSync(tmpTest, 'ok');
    fs.unlinkSync(tmpTest);
  } catch (e) {
    const msg = 'Build environment does NOT allow file writes. Cannot proceed.';
    log(msg);
    report.push(msg);
    finishReport(report, actions);
    process.exit(0);
  }

  // 1) Create public/robots.txt
  const robotsPath = path.join(root, 'public', 'robots.txt');
  const robotsContent = `User-agent: *
Allow: /

Sitemap: https://boomevents.co.uk/sitemap.xml

# AI crawlers - allow for GEO inclusion (adjust if you want)
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-User
Allow: /
User-agent: Claude-SearchBot
Allow: /`;
  safeWriteFile(robotsPath, robotsContent);
  actions.push({ file: 'public/robots.txt', action: 'created/updated' });
  report.push('Created/updated public/robots.txt');

  // 2) Create public/sitemap.xml by reading public/events.json (if present) else minimal
  const eventsJsonPath = path.join(root, 'public', 'events.json');
  let sitemapContent;
  const siteRootURL = 'https://boomevents.co.uk'; // production domain; change if needed
  if (exists(eventsJsonPath)) {
    const events = safeReadJson(eventsJsonPath) || [];
    let urls = [
      `<url><loc>${siteRootURL}/</loc><changefreq>daily</changefreq></url>`,
      `<url><loc>${siteRootURL}/tickets</loc></url>`,
      `<url><loc>${siteRootURL}/events</loc></url>`
    ];
    events.forEach(ev => {
      const slug = ev.slug || (ev.title ? ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') : null);
      if (slug) {
        urls.push(`<url><loc>${siteRootURL}/events/${slug}/</loc></url>`);
      } else if (ev.id && ev.id.toString) {
        urls.push(`<url><loc>${siteRootURL}/events/${ev.id}/</loc></url>`);
      }
    });
    sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  } else {
    sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteRootURL}/</loc><changefreq>daily</changefreq></url>\n  <url><loc>${siteRootURL}/events</loc></url>\n</urlset>`;
  }
  const sitemapPath = path.join(root, 'public', 'sitemap.xml');
  safeWriteFile(sitemapPath, sitemapContent);
  actions.push({ file: 'public/sitemap.xml', action: 'created/updated' });
  report.push('Created/updated public/sitemap.xml');

  // 3) Create head snippets for Organization + site meta + event head include
  const headDir = path.join(root, 'head-snippets');
  if (!fs.existsSync(headDir)) fs.mkdirSync(headDir, { recursive: true });

  const orgJsonLd = `<script type="application/ld+json">
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
  safeWriteFile(path.join(headDir, 'organization.jsonld'), orgJsonLd);
  actions.push({ file: 'head-snippets/organization.jsonld', action: 'created/updated' });
  report.push('Wrote head-snippets/organization.jsonld');

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
  safeWriteFile(path.join(headDir, 'site-meta.html'), siteMeta);
  actions.push({ file: 'head-snippets/site-meta.html', action: 'created/updated' });
  report.push('Wrote head-snippets/site-meta.html');

  const eventHeadInclude = `<link rel="canonical" href="{{ canonical }}">
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
  safeWriteFile(path.join(headDir, 'event-head.html'), eventHeadInclude);
  actions.push({ file: 'head-snippets/event-head.html', action: 'created/updated' });
  report.push('Wrote head-snippets/event-head.html');

  // 4) Simple FAQ page at public/faq/index.html
  const faqHtml = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FAQ — Boombastic Events</title>
<meta name="description" content="FAQ — Boombastic Events">
<link rel="canonical" href="${siteRootURL}/faq/">
<script type="application/ld+json">
{
 "@context":"https://schema.org",
 "@type":"FAQPage",
 "mainEntity":[
  {"@type":"Question","name":"How do I buy tickets?","acceptedAnswer":{"@type":"Answer","text":"Open the event page, click the ticket link, and complete checkout. You'll receive a confirmation email and e-ticket."}},
  {"@type":"Question","name":"Do you operate across the UK?","acceptedAnswer":{"@type":"Answer","text":"Yes. We operate in Northampton, Luton, Milton Keynes, Bedford, Coventry and the surrounding regions."}},
  {"@type":"Question","name":"Are events family friendly?","acceptedAnswer":{"@type":"Answer","text":"Family events are clearly labelled on the event card; check each event's page for age guidance."}}
 ]
}
</script>
</head><body><main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif;">
<h1>Frequently Asked Questions</h1>
<h2>How do I buy tickets?</h2><p>Open the event page, click the ticket link, complete checkout. You'll get a confirmation email and an e-ticket.</p>
<h2>Do you operate across the UK?</h2><p>Yes — we run events in Northampton, Luton, Milton Keynes and nearby towns.</p>
<h2>Are events family friendly?</h2><p>Some are — check the event details for guidance.</p>
</main></body></html>`;
  safeWriteFile(path.join(root, 'public', 'faq', 'index.html'), faqHtml);
  actions.push({ file: 'public/faq/index.html', action: 'created/updated' });
  report.push('Created public/faq/index.html');

  // 5) Add / update scripts/generate-event-pages.js (idempotent) - generates public/events/<slug>/index.html
  const genScriptPath = path.join(root, 'scripts', 'generate-event-pages.js');
  const genScriptContent = `/* AUTO-GENERATED: generate-event-pages.js
   Reads public/events.json and optional content/event-copy.json to generate per-event static pages.
   Idempotent: safe to run multiple times.
*/
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const eventsPath = path.join(process.cwd(), 'public', 'events.json');
const copyPath = path.join(process.cwd(), 'content', 'event-copy.json');
const outDir = path.join(process.cwd(), 'public', 'events');

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function readJson(p){ if (!fs.existsSync(p)) return null; try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; } }

function withUkOffset(iso){
  if(!iso) return iso;
  if (/[zZ]|[+\\\\-]\\\\d{2}:\\\\d{2}$/.test(iso)) return iso;
  const m = Number(iso.slice(5,7));
  const offset = (m >= 4 && m <= 10) ? '+01:00' : '+00:00';
  return iso + offset;
}

function splitVenueAndCity(location){
  if(!location) return {venue:'', city:''};
  const parts = location.split(',');
  const city = parts.length>1 ? parts[parts.length-1].trim() : '';
  const venue = parts.length>1 ? parts.slice(0,-1).join(',').trim() : (parts[0] || '').trim();
  return { venue, city };
}

function fdate(iso){
  try{ const d = new Date(iso); return d.toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' }); }catch(e){return iso;}
}
function ftime(iso){ try{ const d = new Date(iso); return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }); }catch(e){return iso;} }

function buildEventHtml(event, description, slug){
  const { venue, city } = splitVenueAndCity(event.location || '');
  const start = withUkOffset(event.start);
  const end = withUkOffset(event.end);
  const shareUrl = 'https://boomevents.co.uk/events/' + slug + '/';
  const imageAbs = event.image ? (event.image.startsWith('http') ? event.image : 'https://boomevents.co.uk' + event.image) : '';
  const offers = { "@type":"Offer", "url": event.bookUrl || '', "availability":"https://schema.org/InStock", "priceCurrency":"GBP" };
  if (event.price !== undefined && event.price !== null && !isNaN(Number(event.price))) offers.price = Number(event.price);

  const structured = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title || '',
    "startDate": start,
    "endDate": end,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": { "@type":"Place", "name": venue || (event.location || ''), "address": { "@type":"PostalAddress", "addressLocality": city || '', "addressCountry":"GB" } },
    "image": imageAbs,
    "description": description || event.description || '',
    "organizer": { "@type":"Organization", "name":"Boombastic", "url":"https://boomevents.co.uk" },
    "offers": offers
  };
  const breadcrumb = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://boomevents.co.uk/"},
      {"@type":"ListItem","position":2,"name":"Events","item":"https://boomevents.co.uk/events/"},
      {"@type":"ListItem","position":3,"name": event.title || 'Event', "item": shareUrl}
    ]
  };

  const dateRead = fdate(event.start || '');
  const startTime = ftime(event.start || '');
  const endTime = ftime(event.end || '');

  const utmUrl = event.bookUrl ? new URL(event.bookUrl) : null;
  if (utmUrl) {
    utmUrl.searchParams.set('utm_source', 'boombastic_event_page');
    utmUrl.searchParams.set('utm_medium', 'event_share');
    utmUrl.searchParams.set('utm_campaign', slug);
  }
  
  const whatsappText = encodeURIComponent(\`🎉 Check out this event: \${event.title || ''}\\n\\n\${shareUrl}\`);
  const facebookShareUrl = \`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(shareUrl)}\`;

  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${event.title || 'Event'} | Boombastic Events</title>
    <meta name="description" content="\${description || event.description || ''}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="event">
    <meta property="og:url" content="\${shareUrl}">
    <meta property="og:title" content="\${event.title || 'Event'}">
    <meta property="og:description" content="\${description || event.description || ''}">
    <meta property="og:image" content="\${imageAbs}">
    <meta property="og:site_name" content="Boombastic Events">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="\${shareUrl}">
    <meta property="twitter:title" content="\${event.title || 'Event'}">
    <meta property="twitter:description" content="\${description || event.description || ''}">
    <meta property="twitter:image" content="\${imageAbs}">
    
    <!-- Canonical -->
    <link rel="canonical" href="\${shareUrl}">
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Structured Data -->
    <script type="application/ld+json">\${JSON.stringify(structured)}</script>
    <script type="application/ld+json">\${JSON.stringify(breadcrumb)}</script>
    
    <!-- Custom Styles -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500;600;700&display=swap');
        body { 
            font-family: 'Poppins', sans-serif; 
            background: #0B0B0F;
            color: white;
        }
        .btn-primary {
            background: linear-gradient(135deg, #35A7FF, #FF3CAC);
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
        }
        .share-icons {
            display: flex;
            gap: 12px;
            margin-top: 16px;
        }
        .icon-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: transparent;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .icon-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #13131A;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .toast.show {
            opacity: 1;
        }
        .event-image {
            aspect-ratio: 1 / 1;
            object-fit: cover;
        }
    </style>
</head>
<body class="min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Navigation -->
        <nav class="mb-8">
            <a href="/" class="text-white hover:text-blue-400 transition-colors">
                ← Back to Boombastic Events
            </a>
        </nav>
        
        <!-- Event Header -->
        <div class="grid md:grid-cols-2 gap-8 mb-8">
            <div>
                <img src="\${event.image || imageAbs}" alt="\${event.title || 'Event'}" class="w-full rounded-xl shadow-lg event-image">
            </div>
            <div>
                <h1 class="text-3xl md:text-4xl font-bold mb-4">\${event.title || 'Event'}</h1>
                <div class="text-lg text-gray-300 space-y-2 mb-6">
                    <p><strong>📅 Date:</strong> \${dateRead}</p>
                    <p><strong>⏰ Time:</strong> \${startTime} - \${endTime}</p>
                    <p><strong>📍 Venue:</strong> \${venue || event.location}</p>
                </div>
                
                <!-- Book Now Button -->
                \${event.bookUrl ? \`<a href="\${utmUrl ? utmUrl.toString() : event.bookUrl}" 
                   target="_blank" 
                   class="btn-primary mb-4 block text-center"
                   onclick="if(typeof gtag !== 'undefined') gtag('event', 'book_now_click', { 'event_category': 'Event Page', 'event_label': '\${event.title}' });">
                    🎫 Book Now
                </a>\` : ''}
                
                <!-- Share Section -->
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-2">Share this event:</h3>
                    <div class="share-icons">
                        <a href="https://wa.me/?text=\${whatsappText}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="if(typeof gtag !== 'undefined') gtag('event', 'whatsapp_share', { 'event_category': 'Event Page', 'event_label': '\${event.title}' });"
                           title="Share on WhatsApp">
                            📱
                        </a>
                        <a href="\${facebookShareUrl}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="if(typeof gtag !== 'undefined') gtag('event', 'facebook_share', { 'event_category': 'Event Page', 'event_label': '\${event.title}' });"
                           title="Share on Facebook">
                            📘
                        </a>
                        <button onclick="copyLink()" 
                                class="icon-btn"
                                title="Copy Link">
                            🔗
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Event Description -->
        <div class="bg-gray-900 rounded-xl p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">About This Event</h2>
            <p class="text-gray-300 text-lg leading-relaxed">\${description || event.description || ''}</p>
        </div>
        
        <!-- Call to Action -->
        <div class="text-center">
            \${event.bookUrl ? \`<a href="\${utmUrl ? utmUrl.toString() : event.bookUrl}" 
               target="_blank" 
               class="btn-primary text-xl px-8 py-4"
               onclick="if(typeof gtag !== 'undefined') gtag('event', 'book_now_bottom_click', { 'event_category': 'Event Page', 'event_label': '\${event.title}' });">
                🎫 Get Your Tickets Now
            </a>\` : ''}
        </div>
    </div>
    
    <!-- Toast Notification -->
    <div id="toast" class="toast">Link copied to clipboard!</div>
    
    <!-- Scripts -->
    <script>
        function copyLink() {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 3000);
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'copy_link', { 
                        'event_category': 'Event Page', 
                        'event_label': '\${event.title || ''}'
                    });
                }
            });
        }
    </script>
</body>
</html>\`;
}

ensureDir(outDir);
const events = readJson(eventsPath) || [];
const copy = readJson(copyPath) || {};
events.forEach(ev => {
  const slug = ev.slug || (ev.title ? ev.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') : (ev.id || 'event'));
  const desc = copy[String(ev.id)] || copy[slug] || ev.description || '';
  const html = buildEventHtml(ev, desc, slug);
  const dir = path.join(outDir, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir,'index.html'), html, 'utf8');
  console.log('Generated event page:', slug);
});
console.log('Event generation complete.');`;
  safeWriteFile(genScriptPath, genScriptContent);
  actions.push({ file: 'scripts/generate-event-pages.js', action: 'created/updated' });
  report.push('Wrote/updated scripts/generate-event-pages.js');

  // 6) Optionally update package.json scripts.build to run generator first
  const pkgPath = path.join(root, 'package.json');
  const pkg = safeReadJson(pkgPath);
  if (pkg) {
    pkg.scripts = pkg.scripts || {};
    if (!pkg.scripts['generate:events']) pkg.scripts['generate:events'] = 'node scripts/generate-event-pages.js';
    if (!pkg.scripts['build'] || !pkg.scripts['build'].includes('generate:events')) {
      pkg.scripts['build'] = `npm run generate:events && ${pkg.scripts['build'] || 'vite build'}`;
      safeWriteFile(pkgPath, JSON.stringify(pkg, null, 2));
      actions.push({ file: 'package.json', action: 'updated (scripts.build)' });
      report.push('Updated package.json build script to run event generator first');
    } else {
      report.push('package.json already set to generate events on build');
    }
  } else {
    report.push('No package.json found — skipping package.json updates (CI may fail if no build step)');
  }

  // 7) Try running the generator now (helps local dev or build step)
  try {
    const gen = require(path.join(root, 'scripts', 'generate-event-pages.js'));
    // generator is a script file; instead of invoking as module, run child_process spawn to execute node
    const { execSync } = require('child_process');
    execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
    report.push('Ran scripts/generate-event-pages.js successfully');
  } catch (e) {
    report.push('Could not run scripts/generate-event-pages.js during this step. It will run during build if environment allows.');
  }

  // 8) Validate outputs: check one generated event file for timezone and offers
  const publicEventsDir = path.join(root, 'public', 'events');
  if (fs.existsSync(publicEventsDir)) {
    const generated = [];
    const slugs = fs.readdirSync(publicEventsDir).filter(f => fs.statSync(path.join(publicEventsDir, f)).isDirectory());
    for (const slug of slugs.slice(0,10)) {
      const htmlPath = path.join(publicEventsDir, slug, 'index.html');
      if (!fs.existsSync(htmlPath)) continue;
      const html = fs.readFileSync(htmlPath, 'utf8');
      const hasStartDate = /"startDate"\\s*:\\s*".+?[+\\\\-]\\\\d{2}:\\\\d{2}"/.test(html);
      const hasOffersUrl = /"offers"\\s*:\\s*{[^}]*"url"\\s*:\\s*".+?"/.test(html);
      const priceNumeric = /"offers"\\s*:\\s*{[^}]*"price"\\s*:\\s*\\\\d+/.test(html);
      generated.push({ slug, hasStartDate, hasOffersUrl, priceNumeric });
    }
    report.push(`Validated ${generated.length} generated event pages (sample):`);
    generated.forEach(g => report.push(` - ${g.slug}: tzOk=${g.hasStartDate}, offersUrl=${g.hasOffersUrl}, priceNumeric=${g.priceNumeric}`));
    actions.push({ file: 'public/events/', action: `generated ${generated.length} pages (sample)` });
  } else {
    report.push('No generated event pages found under public/events/');
  }

  // 9) Final validation checks for robots & sitemap existence
  const checks = [
    { p: robotsPath, label: 'robots.txt' },
    { p: sitemapPath, label: 'sitemap.xml' },
    { p: path.join(root, 'public', 'faq', 'index.html'), label: 'public/faq/index.html' },
    { p: path.join(headDir, 'organization.jsonld'), label: 'head-snippets/organization.jsonld' },
    { p: genScriptPath, label: 'scripts/generate-event-pages.js' },
  ];
  report.push('Final file existence checks:');
  checks.forEach(c => report.push(` - ${c.label}: ${fs.existsSync(c.p) ? 'OK' : 'MISSING'}`));

  // 10) Compose validation report file
  finishReport(report, actions);
}

function finishReport(report, actions) {
  const out = [];
  out.push(`# Boombastic GEO/SEO One-Shot Validation Report`);
  out.push('');
  out.push(`Generated at: ${now}`);
  out.push('');
  out.push('## Actions performed');
  actions.forEach(a => out.push(`- ${a.file}: ${a.action}`));
  out.push('');
  out.push('## Notes & validation output');
  report.forEach(r => out.push(`- ${r}`));
  out.push('');
  out.push('## Next steps & items that may need human attention');
  out.push('- Confirm Lovable build command is set to: `node scripts/lovable-one-shot.js && npm run build`');
  out.push('- If your production domain is not https://boomevents.co.uk, update the siteRootURL in scripts/generate-event-pages.js and re-run.');
  out.push('- Review generated event pages under public/events/ for content accuracy (dates, venue, ticket links).');
  out.push('- Push changes and validate in Google Search Console: submit sitemap.xml and check Coverage after 24–48h.');
  out.push('- If the build environment refuses to write files, generate event pages locally (node scripts/generate-event-pages.js) and push the generated public/ directory.');
  out.push('');
  out.push('## End of report');
  const outText = out.join('\\n');
  const outPath = path.join(process.cwd(), 'public', 'geo-seo-validation-report.md');
  try {
    fs.writeFileSync(outPath, outText, 'utf8');
    console.log('Wrote validation report to', outPath);
  } catch (e) {
    console.error('Failed to write validation report:', e);
  }
  // Also print to stdout for CI logs
  console.log('\\n----- GEO/SEO VALIDATION SUMMARY -----\\n');
  console.log(outText);
}

main();