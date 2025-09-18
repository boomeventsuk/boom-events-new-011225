// scripts/update-sitemap-events.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function slugify(text = '') {
  return String(text).toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
}

// Load events
const eventsPath = path.join(root, 'public', 'events.json');
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

// Generate sitemap URLs for events only
const eventUrls = events
  .filter(event => event.title && event.start)
  .map(event => {
    const slug = event.slug || slugify(event.title);
    return `  <url><loc>https://boomevents.co.uk/events/${slug}/</loc></url>`;
  })
  .join('\n');

// Read current sitemap and update event URLs
const sitemapPath = path.join(root, 'public', 'sitemap.xml');
const currentSitemap = fs.readFileSync(sitemapPath, 'utf8');

// Extract non-event URLs
const lines = currentSitemap.split('\n');
const nonEventUrls = lines.filter(line => 
  line.includes('<url><loc>') && 
  !line.includes('/events/') &&
  line.trim() !== ''
);

// Rebuild sitemap
const newSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nonEventUrls.join('\n')}
${eventUrls}
</urlset>`;

fs.writeFileSync(sitemapPath, newSitemap);
console.log('Sitemap updated with current events');