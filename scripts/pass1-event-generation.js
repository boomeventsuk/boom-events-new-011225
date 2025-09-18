// scripts/pass1-event-generation.js
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const root = path.resolve(__dirname, '..');

// Helper functions
function slugify(text = '') {
  return String(text).toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
}

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isoOrToISOString(s) {
  if (!s) return '';
  if (/[+\-]\d{2}:?\d{2}$/.test(s) || s.endsWith('Z')) return s;
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toISOString();
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// Load events
const eventsPath = path.join(root, 'public', 'events.json');
if (!fs.existsSync(eventsPath)) {
  console.error('Missing events.json');
  process.exit(1);
}

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const results = {
  eventsWithHTML: 0,
  eventsWithJSON: 0,
  eventsWithPrice: 0,
  eventsMissingPrice: 0,
  processed: [],
  missing: [],
  errors: []
};

const todoItems = [];

// Process each event
for (const event of events) {
  const slug = event.slug || slugify(event.title || '');
  
  if (!slug) {
    todoItems.push(`Event ID ${event.id}: No slug could be generated from title "${event.title}"`);
    results.errors.push({ id: event.id, error: 'no_slug' });
    continue;
  }

  if (!event.title || !event.start) {
    todoItems.push(`Event ${slug}: Missing required fields - title: ${!!event.title}, start: ${!!event.start}`);
    results.missing.push(slug);
    continue;
  }

  const eventDir = path.join(root, 'public', 'events', slug);
  const htmlFile = path.join(eventDir, 'index.html');
  const jsonFile = path.join(eventDir, 'index.json');

  ensureDir(eventDir);

  // Create event JSON
  const eventJson = {
    ...event,
    slug: slug,
    shareUrl: `https://boomevents.co.uk/events/${slug}/`,
    startDate: isoOrToISOString(event.start),
    endDate: isoOrToISOString(event.end)
  };

  fs.writeFileSync(jsonFile, JSON.stringify(eventJson, null, 2), 'utf8');
  results.eventsWithJSON++;

  // Check for price
  const hasNumericPrice = event.price !== undefined && !isNaN(Number(event.price));
  if (hasNumericPrice) {
    results.eventsWithPrice++;
  } else {
    results.eventsMissingPrice++;
    todoItems.push(`Event ${slug}: Missing numeric price (current: ${event.price})`);
  }

  // Create structured data
  const ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: eventJson.startDate,
    endDate: eventJson.endDate,
    url: eventJson.shareUrl,
    image: event.image || '',
    description: event.description || '',
    location: {
      "@type": "Place",
      name: event.location || ''
    },
    organizer: {
      "@type": "Organization",
      name: "Boombastic Events",
      url: "https://boomevents.co.uk"
    },
    offers: {
      "@type": "Offer",
      url: event.bookUrl || eventJson.shareUrl,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString()
    }
  };

  // Only add price if numeric
  if (hasNumericPrice) {
    ld.offers.price = Number(event.price);
  }

  // Format dates for display
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const formatDate = (date) => date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formatTime = (date) => date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Create HTML
  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(event.title)} | Boombastic Events</title>
  <link rel="canonical" href="${eventJson.shareUrl}">
  <meta name="description" content="${esc(event.description || event.title)}">
  <meta property="og:type" content="event">
  <meta property="og:title" content="${esc(event.title)}">
  <meta property="og:description" content="${esc(event.description || event.title)}">
  <meta property="og:url" content="${eventJson.shareUrl}">
  <meta property="og:image" content="${event.image || ''}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(event.title)}">
  <meta name="twitter:description" content="${esc(event.description || event.title)}">
  <meta name="twitter:image" content="${event.image || ''}">
  <link rel="icon" href="/favicon.ico">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>
    body { font-family: 'Poppins', sans-serif; }
    .btn-primary {
      background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
      color: white;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: transform 0.2s;
    }
    .btn-primary:hover { transform: translateY(-2px); }
    .share-icons { display: flex; gap: 12px; margin: 20px 0; }
    .icon-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .icon-btn:hover { transform: scale(1.1); }
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      display: none;
    }
    .toast.show { display: block; }
    .ticket-banner {
      background: linear-gradient(135deg, #fef3c7, #fbbf24);
      color: #92400e;
      padding: 12px 20px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid #f59e0b;
    }
    .ticket-banner strong {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
    }
  </style>
</head>
<body class="bg-gray-50">
  <div class="max-w-4xl mx-auto p-6">
    <nav class="mb-6">
      <a href="/" class="text-blue-600 hover:underline">&larr; Back to Events</a>
    </nav>

    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      ${event.image ? `<img src="${event.image}" alt="${esc(event.title)}" class="w-full h-64 object-cover">` : ''}
      
      <div class="p-6">
        <h1 class="text-3xl font-bold mb-4" style="font-family: 'Bebas Neue', sans-serif;">${esc(event.title)}</h1>
        
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="font-semibold text-gray-700">Date & Time</h3>
            <p>${formatDate(startDate)}</p>
            <p>${formatTime(startDate)} - ${formatTime(endDate)}</p>
          </div>
          <div>
            <h3 class="font-semibold text-gray-700">Venue</h3>
            <p>${esc(event.location || '')}</p>
          </div>
        </div>

        ${event.bookUrl ? `<a href="${event.bookUrl}" class="btn-primary" onclick="gtag('event', 'click', { event_category: 'booking', event_label: '${slug}' })">Book Now</a>` : ''}
        
        <div class="ticket-banner" aria-live="polite">
          <strong>Tickets</strong>
          <p>Group ticket offers available on each event page.</p>
        </div>

        <div class="share-icons">
          <a href="https://wa.me/?text=${encodeURIComponent(event.title + ' - ' + eventJson.shareUrl)}" 
             class="icon-btn bg-green-500"
             onclick="gtag('event', 'share', { method: 'WhatsApp', content_type: 'event', item_id: '${slug}' })"
             target="_blank" rel="noopener">
            📱
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventJson.shareUrl)}"
             class="icon-btn bg-blue-600"
             onclick="gtag('event', 'share', { method: 'Facebook', content_type: 'event', item_id: '${slug}' })"
             target="_blank" rel="noopener">
            📘
          </a>
          <button onclick="copyLink()" class="icon-btn bg-gray-600">
            🔗
          </button>
        </div>

        ${event.description ? `
        <div class="mt-8">
          <h2 class="text-2xl font-bold mb-4">About This Event</h2>
          <p class="text-gray-700 leading-relaxed">${esc(event.description)}</p>
        </div>
        ` : ''}

        ${event.bookUrl ? `
        <div class="mt-8 text-center">
          <a href="${event.bookUrl}" class="btn-primary" onclick="gtag('event', 'click', { event_category: 'booking_bottom', event_label: '${slug}' })">Get Your Tickets Now</a>
        </div>
        ` : ''}
      </div>
    </div>
  </div>

  <div id="toast" class="toast">Link copied to clipboard!</div>

  <script>
    function copyLink() {
      navigator.clipboard.writeText(window.location.href).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
        gtag('event', 'share', { method: 'Copy Link', content_type: 'event', item_id: '${slug}' });
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(htmlFile, html, 'utf8');
  results.eventsWithHTML++;
  results.processed.push(slug);
}

// Write TODO file
if (todoItems.length > 0) {
  const todoPath = path.join(root, 'automation', `todo-missing-data-${timestamp}.md`);
  ensureDir(path.dirname(todoPath));
  fs.writeFileSync(todoPath, `# TODO - Missing Data Items\n\nGenerated: ${new Date().toISOString()}\n\n${todoItems.map(item => `- ${item}`).join('\n')}\n`);
}

// Generate reports
const reportJson = {
  timestamp: new Date().toISOString(),
  summary: {
    totalEvents: events.length,
    eventsWithHTML: results.eventsWithHTML,
    eventsWithJSON: results.eventsWithJSON,
    eventsWithPrice: results.eventsWithPrice,
    eventsMissingPrice: results.eventsMissingPrice,
    processed: results.processed.length,
    missing: results.missing.length,
    errors: results.errors.length
  },
  details: {
    processed: results.processed,
    missing: results.missing,
    errors: results.errors,
    todoItems: todoItems
  }
};

const reportPath = path.join(root, 'automation', `generation-report-${timestamp}.json`);
ensureDir(path.dirname(reportPath));
fs.writeFileSync(reportPath, JSON.stringify(reportJson, null, 2));

const reportMdPath = path.join(root, 'automation', `generation-report-${timestamp}.md`);
const reportMd = `# Event Generation Report

Generated: ${new Date().toISOString()}

## Summary
- Total Events: ${reportJson.summary.totalEvents}
- Events with HTML: ${reportJson.summary.eventsWithHTML}
- Events with JSON: ${reportJson.summary.eventsWithJSON}
- Events with Price: ${reportJson.summary.eventsWithPrice}
- Events Missing Price: ${reportJson.summary.eventsMissingPrice}

## Status
- Processed: ${reportJson.summary.processed}
- Missing Required Data: ${reportJson.summary.missing}
- Errors: ${reportJson.summary.errors}

${todoItems.length > 0 ? `## TODO Items\n${todoItems.map(item => `- ${item}`).join('\n')}` : '## ✅ All events processed successfully'}

## Next Steps
1. Review TODO items if any
2. Validate generated files
3. Update sitemap if needed
`;

fs.writeFileSync(reportMdPath, reportMd);

console.log('PASS 1 Complete:');
console.log(`(a) Events with HTML: ${results.eventsWithHTML}`);
console.log(`(b) Events with JSON: ${results.eventsWithJSON}`);
console.log(`(c) Events with offers.price set: ${results.eventsWithPrice}`);
console.log(`(d) Events missing price: ${results.eventsMissingPrice}`);
console.log(`Reports generated: ${reportPath}, ${reportMdPath}`);
if (todoItems.length > 0) {
  console.log(`TODO file: ${path.join(root, 'automation', \`todo-missing-data-\${timestamp}.md\`)}`);
}