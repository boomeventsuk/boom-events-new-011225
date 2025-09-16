// scripts/generate-single-event.js
// Usage: node scripts/generate-single-event.js <slug>
const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) { 
  console.error('Usage: node scripts/generate-single-event.js <slug>'); 
  process.exit(1); 
}

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events.json');
const eventCopyPath = path.join(root, 'content', 'event-copy.json');

// Helper functions
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function withUkOffset(isoDateString) {
  const date = new Date(isoDateString);
  const ukOffset = '+01:00'; // UK is UTC+1 during BST, UTC+0 during GMT
  return isoDateString.includes('+') || isoDateString.includes('Z') 
    ? isoDateString 
    : isoDateString + ukOffset;
}

function splitVenueCity(location) {
  const parts = location.split(',').map(s => s.trim());
  return {
    venue: parts[0] || location,
    city: parts[1] || parts[0]
  };
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEventHtml(event, description, eventSlug) {
  const { venue, city } = splitVenueCity(event.location);
  const startDateFormatted = withUkOffset(event.start);
  const endDateFormatted = withUkOffset(event.end);
  
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(event.title)} | Boombastic Events</title>
  <meta name="description" content="${esc(description.substring(0, 155))}...">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="event">
  <meta property="og:url" content="https://boomevents.co.uk/events/${eventSlug}/">
  <meta property="og:title" content="${esc(event.title)}">
  <meta property="og:description" content="${esc(description.substring(0, 155))}...">
  <meta property="og:image" content="${event.image || 'https://boomevents.co.uk/hero-crowd.jpg'}">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://boomevents.co.uk/events/${eventSlug}/">
  <meta property="twitter:title" content="${esc(event.title)}">
  <meta property="twitter:description" content="${esc(description.substring(0, 155))}...">
  <meta property="twitter:image" content="${event.image || 'https://boomevents.co.uk/hero-crowd.jpg'}">

  <link rel="canonical" href="https://boomevents.co.uk/events/${eventSlug}/">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <script src="https://cdn.tailwindcss.com"></script>
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${esc(event.title)}",
    "startDate": "${startDateFormatted}",
    "endDate": "${endDateFormatted}",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": "${esc(venue)}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${esc(city)}",
        "addressCountry": "GB"
      }
    },
    "image": ["${event.image || 'https://boomevents.co.uk/hero-crowd.jpg'}"],
    "description": "${esc(description)}",
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": "https://boomevents.co.uk"
    },
    "offers": {
      "@type": "Offer",
      "url": "${event.bookUrl}",
      "price": "${event.price || '0'}",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-01-01T00:00:00Z"
    }
  }
  </script>
</head>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;600;700&display=swap');

body {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 100vh;
}

.btn-primary {
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  border: none;
  color: white;
  padding: 15px 30px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.share-icons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 20px 0;
}

.icon-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.1);
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 15px 20px;
  border-radius: 5px;
  display: none;
  z-index: 1000;
}
</style>

<body>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <nav class="mb-8">
      <a href="/" class="text-white hover:text-gray-200 transition-colors">← Back to Events</a>
    </nav>

    <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8">
      ${event.image ? `<img src="${event.image}" alt="${esc(event.title)}" class="w-full h-64 object-cover rounded-2xl mb-6">` : ''}
      
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-center" style="font-family: 'Bebas Neue', cursive;">${esc(event.title)}</h1>
      
      <div class="grid md:grid-cols-3 gap-4 text-center mb-8">
        <div>
          <div class="text-sm opacity-80">Date</div>
          <div class="font-semibold">${new Date(event.start).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        <div>
          <div class="text-sm opacity-80">Time</div>
          <div class="font-semibold">${new Date(event.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div>
          <div class="text-sm opacity-80">Venue</div>
          <div class="font-semibold">${esc(venue)}, ${esc(city)}</div>
        </div>
      </div>

      <div class="text-center mb-8">
        <a href="${event.bookUrl}" class="btn-primary" onclick="gtag('event', 'click', {'event_category': 'button', 'event_label': 'book_now'});">Book Now</a>
      </div>

      <div class="share-icons">
        <button class="icon-btn" onclick="shareWhatsApp()" title="Share on WhatsApp">📱</button>
        <button class="icon-btn" onclick="shareFacebook()" title="Share on Facebook">📘</button>
        <button class="icon-btn" onclick="copyLink()" title="Copy Link">🔗</button>
      </div>
    </div>

    <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-8">
      <h2 class="text-2xl font-bold mb-4">About This Event</h2>
      <p class="text-lg leading-relaxed mb-6">${esc(description)}</p>
      
      <div class="text-center">
        <a href="${event.bookUrl}" class="btn-primary" onclick="gtag('event', 'click', {'event_category': 'button', 'event_label': 'get_tickets'});">Get Your Tickets Now</a>
      </div>
    </div>
  </div>

  <div id="toast" class="toast">Link copied to clipboard!</div>

  <script>
    function shareWhatsApp() {
      const text = encodeURIComponent("Check out ${event.title} - " + window.location.href);
      window.open('https://wa.me/?text=' + text, '_blank');
      gtag('event', 'share', {'method': 'whatsapp', 'content_type': 'event', 'item_id': '${eventSlug}'});
    }

    function shareFacebook() {
      const url = encodeURIComponent(window.location.href);
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
      gtag('event', 'share', {'method': 'facebook', 'content_type': 'event', 'item_id': '${eventSlug}'});
    }

    function copyLink() {
      navigator.clipboard.writeText(window.location.href).then(function() {
        const toast = document.getElementById('toast');
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
        gtag('event', 'share', {'method': 'copy_link', 'content_type': 'event', 'item_id': '${eventSlug}'});
      });
    }

    // Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  </script>
</body>
</html>`;
}

// Main execution
const events = readJson(eventsPath);
const eventCopy = readJson(eventCopyPath) || {};

if (!events) {
  console.error('Could not read events.json');
  process.exit(1);
}

// Find the event by slug
const event = events.find(e => {
  const eventSlug = e.slug || slugify(e.title);
  return eventSlug === slug;
});

if (!event) {
  console.error(`Event with slug "${slug}" not found`);
  process.exit(1);
}

// Generate slug if not present
const eventSlug = event.slug || slugify(event.title);
const description = eventCopy[eventSlug] || event.description || 'Join us for an amazing event!';

// Create event directory
const eventDir = path.join(root, 'public', 'events', eventSlug);
ensureDir(eventDir);

// Generate HTML
const html = buildEventHtml(event, description, eventSlug);
const htmlPath = path.join(eventDir, 'index.html');
fs.writeFileSync(htmlPath, html, 'utf8');

// Generate JSON
const eventJson = {
  ...event,
  slug: eventSlug,
  shareUrl: `https://boomevents.co.uk/events/${eventSlug}/`,
  startDate: withUkOffset(event.start),
  endDate: withUkOffset(event.end)
};

const jsonPath = path.join(eventDir, 'index.json');
fs.writeFileSync(jsonPath, JSON.stringify(eventJson, null, 2), 'utf8');

console.log(`Generated event files for: ${eventSlug}`);
console.log(`  HTML: ${htmlPath}`);
console.log(`  JSON: ${jsonPath}`);