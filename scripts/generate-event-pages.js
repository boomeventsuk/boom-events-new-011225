/* The generator script is also created by the main script; keep this file as a standalone fallback.
   But if you already created the above one-shot script, this may already exist.
*/
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const eventsPath = path.join(process.cwd(), 'public', 'events.json');
const copyPath = path.join(process.cwd(), 'content', 'event-copy.json');
const outDir = path.join(process.cwd(), 'public', 'events');

function ensureDir(p){ if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function readJson(p){ if (!fs.existsSync(p)) return null; try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e) { return null; } }

function withUkOffset(iso){
  if(!iso) return iso;
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(iso)) return iso;
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

function fdate(iso){ try{ const d = new Date(iso); return d.toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' }); }catch(e){return iso;} }
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

  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${event.title} | Boombastic</title><meta name="description" content="${description || event.description || ''}"><link rel="canonical" href="${shareUrl}">
<script type="application/ld+json">${JSON.stringify(structured)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
</head><body><main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif;"><h1>${event.title}</h1><p>${description || event.description || ''}</p><p><strong>Date:</strong> ${dateRead} <strong>Time:</strong> ${startTime}–${endTime}</p><p><strong>Venue:</strong> ${venue || event.location}</p>${event.bookUrl ? '<p><a href="'+event.bookUrl+'" target="_blank" rel="noopener">Buy tickets</a></p>' : ''}</main></body></html>`;
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
console.log('Event generation complete.');