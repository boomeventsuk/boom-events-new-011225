const fs = require('fs');
const path = require('path');

// Helper functions
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatTime(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${startTime} - ${endTime}`;
}

function withUkOffset(isoString) {
  if (!isoString) return isoString;
  // Add timezone offset for UK
  if (!isoString.includes('+') && !isoString.includes('Z')) {
    return isoString + '+01:00';
  }
  return isoString;
}

function buildEventJson(event) {
  const slug = slugify(event.title);
  return {
    ...event,
    slug,
    shareUrl: `https://boomevents.co.uk/events/${slug}/`,
    startDate: withUkOffset(event.start),
    endDate: withUkOffset(event.end)
  };
}

function buildEventHtml(event, slug) {
  const eventJson = buildEventJson(event);
  const hasNumericPrice = typeof event.price === 'number' && !isNaN(event.price);
  
  // Build structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description,
    "startDate": withUkOffset(event.start),
    "endDate": withUkOffset(event.end),
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": event.location
    },
    "image": event.image,
    "url": `https://boomevents.co.uk/events/${slug}/`
  };

  // Only add offers if price is numeric
  if (hasNumericPrice) {
    structuredData.offers = {
      "@type": "Offer",
      "price": event.price,
      "priceCurrency": "GBP",
      "url": event.bookUrl,
      "availability": "https://schema.org/InStock"
    };
  }

  const venue = event.location.split(',')[0].trim();
  const city = event.location.split(',')[1]?.trim() || '';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(event.title)} | Boom Events</title>
  <meta name="description" content="${esc(event.description.substring(0, 160))}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://boomevents.co.uk/events/${slug}/">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${esc(event.title)}">
  <meta property="og:description" content="${esc(event.description.substring(0, 160))}">
  <meta property="og:image" content="${esc(event.image)}">
  <meta property="og:url" content="https://boomevents.co.uk/events/${slug}/">
  <meta property="og:type" content="event">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(event.title)}">
  <meta name="twitter:description" content="${esc(event.description.substring(0, 160))}">
  <meta name="twitter:image" content="${esc(event.image)}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .event-image { width: 100%; max-width: 600px; height: auto; border-radius: 8px; }
    .event-details { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 10px 10px 0; }
    .button:hover { background: #be185d; }
    .button.secondary { background: #3b82f6; }
    .button.secondary:hover { background: #2563eb; }
  </style>
</head>
<body>
  <header>
    <h1>${esc(event.title)}</h1>
  </header>
  
  <main>
    <img src="${esc(event.image)}" alt="${esc(event.title)}" class="event-image">
    
    <div class="event-details">
      <h2>Event Details</h2>
      <p><strong>Date:</strong> ${formatDate(event.start)}</p>
      <p><strong>Time:</strong> ${formatTime(event.start, event.end)}</p>
      <p><strong>Venue:</strong> ${esc(venue)}</p>
      <p><strong>Location:</strong> ${esc(city)}</p>
      ${hasNumericPrice ? `<p><strong>Price:</strong> £${event.price}</p>` : ''}
    </div>
    
    <div class="description">
      <h2>About This Event</h2>
      <p>${esc(event.description)}</p>
    </div>
    
    <div class="actions">
      <a href="${esc(event.bookUrl)}" class="button" target="_blank" rel="noopener">Get Tickets</a>
      ${event.infoUrl ? `<a href="${esc(event.infoUrl)}" class="button secondary" target="_blank" rel="noopener">Event Info</a>` : ''}
    </div>
  </main>
  
  <footer>
    <p><a href="/">← Back to all events</a></p>
  </footer>
</body>
</html>`;
}

// Main execution
function generateAllEventPages() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const eventsPath = path.join(__dirname, '..', 'public', 'events.json');
  
  if (!fs.existsSync(eventsPath)) {
    console.error('Missing events.json at', eventsPath);
    process.exit(1);
  }

  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  const results = {
    timestamp,
    totalEvents: events.length,
    generatedEvents: 0,
    eventsWithPrice: 0,
    eventsWithoutPrice: 0,
    slugsMissingPrice: [],
    generatedSlugs: [],
    errors: []
  };

  console.log(`Generating pages for ${events.length} events...`);

  for (const event of events) {
    try {
      const slug = slugify(event.title);
      const eventDir = path.join(__dirname, '..', 'public', 'events', slug);
      const hasNumericPrice = typeof event.price === 'number' && !isNaN(event.price);
      
      // Ensure directory exists
      ensureDir(eventDir);
      
      // Generate index.json
      const eventJson = buildEventJson(event);
      fs.writeFileSync(
        path.join(eventDir, 'index.json'),
        JSON.stringify(eventJson, null, 2)
      );
      
      // Generate index.html
      const eventHtml = buildEventHtml(event, slug);
      fs.writeFileSync(
        path.join(eventDir, 'index.html'),
        eventHtml
      );
      
      results.generatedEvents++;
      results.generatedSlugs.push(slug);
      
      if (hasNumericPrice) {
        results.eventsWithPrice++;
      } else {
        results.eventsWithoutPrice++;
        results.slugsMissingPrice.push(slug);
      }
      
      console.log(`✓ Generated: ${slug}`);
      
    } catch (error) {
      console.error(`✗ Failed to generate event: ${event.title}`, error.message);
      results.errors.push({
        eventTitle: event.title,
        error: error.message
      });
    }
  }

  // Ensure automation directory exists
  ensureDir(path.join(__dirname, '..', 'automation'));
  
  // Write generation report
  const reportPath = path.join(__dirname, '..', 'automation', `generation-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Generation Report ===');
  console.log(`Total events: ${results.totalEvents}`);
  console.log(`Generated successfully: ${results.generatedEvents}`);
  console.log(`Events with numeric price: ${results.eventsWithPrice}`);
  console.log(`Events without numeric price: ${results.eventsWithoutPrice}`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.slugsMissingPrice.length > 0) {
    console.log('\nSlugs missing numeric price:');
    results.slugsMissingPrice.forEach(slug => console.log(`- ${slug}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(error => console.log(`- ${error.eventTitle}: ${error.error}`));
  }
  
  console.log(`\nReport saved to: ${reportPath}`);
  
  return results.errors.length === 0;
}

// Run the script
if (require.main === module) {
  const success = generateAllEventPages();
  process.exit(success ? 0 : 1);
}

module.exports = { generateAllEventPages };