// scripts/generate-single-event.js
const fs = require('fs');
const path = require('path');

const slugArg = process.argv[2];
if (!slugArg) {
  console.error('Usage: node scripts/generate-single-event.js <slug>');
  process.exit(2);
}

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events-boombastic.json');

if (!fs.existsSync(eventsPath)) {
  console.error('events-boombastic.json not found at', eventsPath);
  process.exit(3);
}

const rawEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const events = rawEvents.map(ev => ({
  ...ev,
  id:       ev.id       || ev.eventCode,
  location: ev.location || (ev.venue && ev.city ? `${ev.venue}, ${ev.city}` : ev.city || ev.venue || ''),
  bookUrl:  ev.bookUrl  || (ev.eventbriteId ? `https://www.eventbrite.co.uk/e/${ev.eventbriteId}` : '')
}));
const findEvent = e => (e.slug && e.slug === slugArg) || (e.id && String(e.id) === slugArg) || (slugify(e.title) === slugArg);
const event = events.find(findEvent);

if (!event) {
  console.error('Event not found for slug/id:', slugArg);
  process.exit(4);
}

// helpers
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}
function slugify(text='') {
  return String(text).toLowerCase().replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-');
}
function esc(str='') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function isoOrToISOString(s) {
  if (!s) return '';
  // if it already includes timezone offset or 'Z', return as-is
  if (/[+\-]\d{2}:?\d{2}$/.test(s) || s.endsWith('Z')) return s;
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toISOString();
}

const eventSlug = event.slug || slugify(event.title || slugArg);
const outDir = path.join(root, 'public', 'events', eventSlug);
ensureDir(outDir);

// JSON output
const eventJson = {
  ...event,
  slug: eventSlug,
  shareUrl: `https://boomevents.co.uk/events/${eventSlug}/`,
  start: isoOrToISOString(event.start || ''),
  end: isoOrToISOString(event.end || '')
};
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(eventJson, null, 2), 'utf8');

// Build minimal, safe HTML with embedded JSON-LD stringified
const ld = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: event.title || '',
  startDate: eventJson.start || '',
  endDate: eventJson.end || '',
  url: eventJson.shareUrl,
  location: {
    "@type": "Place",
    name: event.location || ''
  },
  offers: (() => {
    const o = {
      "@type": "Offer",
      url: event.bookUrl || eventJson.shareUrl,
      priceCurrency: event.priceCurrency || 'GBP',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString()
    };
    if (event.price !== undefined && !Number.isNaN(Number(event.price))) {
      o.price = Number(event.price);
    }
    return o;
  })()
};

const html = `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <title>${esc(event.title || 'Event')} | Boombastic Events</title>
  <link rel="canonical" href="${eventJson.shareUrl}" />
  <meta property="og:url" content="${eventJson.shareUrl}" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <h1>${esc(event.title || '')}</h1>
  <p>${esc(event.description || '')}</p>
  <p><a href="/events/${eventSlug}/index.json" rel="nofollow">Event data (JSON)</a></p>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

console.log('Generated event files for:', eventSlug);
console.log('  HTML ->', path.join(outDir, 'index.html'));
console.log('  JSON ->', path.join(outDir, 'index.json'));