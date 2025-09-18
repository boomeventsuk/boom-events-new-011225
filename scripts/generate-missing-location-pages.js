// scripts/generate-missing-location-pages.js
// Creates missing location pages with proper SEO

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const venuesPath = path.join(root, 'public', 'venues.json');

if (!fs.existsSync(venuesPath)) {
  console.error('venues.json not found');
  process.exit(1);
}

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

const cityDescriptions = {
  'milton-keynes': 'Experience the ultimate party atmosphere with our daytime disco and silent disco events in Milton Keynes. From high-energy 80s throwbacks to multi-channel silent disco battles, we bring decades of iconic music to life with full club production, confetti cannons, and unforgettable singalong moments.',
  'bedford': 'Bedford comes alive with Boombastic Events\' signature daytime disco and family-friendly silent disco parties. Join hundreds of music lovers for afternoon celebrations featuring the biggest 80s, 90s, and 00s hits in an electric atmosphere that lets you party hard and still be home for dinner.',  
  'northampton': 'Northampton\'s premier event destination for daytime disco, silent disco battles, and decades parties. From Whitney Whitney singalongs to Bon Jovi finale moments, our events transform any afternoon into pure celebration with confetti-soaked nostalgia and epic group singalongs.',
  'coventry': 'Coventry discovers the joy of daytime disco with The 2PM Club bringing legendary afternoon energy. Four hours of 80s, 90s and 00s floor-fillers with full club production, confetti cannons, and singalongs that leave you buzzing for days - all perfectly timed so you\'re home for dinner.',
  'birmingham': 'Birmingham\'s daytime disco revolution has arrived with The 2PM Club bringing proper night-out energy to perfect afternoon timing. Experience four hours of decade-spanning anthems with full production, epic singalongs, and that Monday smugness knowing you nailed the weekend without the midnight faff.',
  'luton': 'Luton embraces the daytime disco movement with afternoon raves that change everything. From family silent disco adventures to The 2PM Club\'s legendary 80s, 90s and 00s celebrations, discover events where everyone gets exactly the music they want in an atmosphere that beats screens hands-down.'
};

for (const cityName in venues) {
  const cityData = venues[cityName];
  const citySlug = slugify(cityName);
  const locationDir = path.join(root, 'public', 'locations', citySlug);
  const indexPath = path.join(locationDir, 'index.html');

  // Skip if already exists
  if (fs.existsSync(indexPath)) {
    console.log(`📁 Exists: ${citySlug}`);
    continue;
  }

  ensureDir(locationDir);

  // Build breadcrumb and event list JSON-LD
  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://boomevents.co.uk/" },
      { "@type": "ListItem", "position": 2, "name": "Locations", "item": "https://boomevents.co.uk/locations/" },
      { "@type": "ListItem", "position": 3, "name": cityName, "item": `https://boomevents.co.uk/locations/${citySlug}/` }
    ]
  };

  const eventListLD = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": cityData.venues.flatMap(venue => 
      venue.events.map((event, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": event.title,
        "url": `https://boomevents.co.uk/events/${event.slug}/`
      }))
    )
  };

  const description = cityDescriptions[citySlug] || `Discover daytime disco, silent disco and decades parties in ${cityName}. Join hundreds of party-goers for unforgettable music events featuring 80s, 90s and 00s hits.`;

  const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Events in ${esc(cityName)} | Boombastic Events</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="https://boomevents.co.uk/locations/${citySlug}/">
    <link rel="icon" href="/favicon.ico">
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script type="application/ld+json">${JSON.stringify(breadcrumbLD, null, 2)}</script>
    <script type="application/ld+json">${JSON.stringify(eventListLD, null, 2)}</script>
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;600;700&display=swap');
        
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .event-item {
            transition: all 0.3s ease;
        }
        
        .event-item:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body class="text-white">
    <div class="container mx-auto px-4 py-8">
        <!-- Navigation -->
        <nav class="mb-8">
            <a href="/" class="inline-flex items-center text-white hover:text-gray-200 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Home
            </a>
        </nav>

        <!-- Header -->
        <header class="text-center mb-12">
            <h1 class="text-4xl md:text-6xl font-bold mb-4" style="font-family: 'Bebas Neue', cursive;">
                Events in ${esc(cityName)}
            </h1>
            <p class="text-xl text-gray-200 max-w-3xl mx-auto">
                ${esc(description)}
            </p>
        </header>

        <!-- Events List -->
        <div class="max-w-4xl mx-auto space-y-6">
            <h2 class="text-2xl font-semibold mb-6">Upcoming Events (${cityData.eventCount})</h2>
            
            ${cityData.venues.flatMap(venue => 
              venue.events.map(event => `
            <div class="event-item bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 class="text-xl font-semibold mb-2">
                    <a href="/events/${event.slug}/" class="text-white hover:text-blue-300 transition-colors">
                        ${esc(event.title)}
                    </a>
                </h3>
                <p class="text-gray-300 text-sm mb-2">📍 ${esc(venue.name)}</p>
                <p class="text-gray-200 text-sm">Experience ${cityName}'s best party atmosphere with live DJs and unforgettable music.</p>
            </div>`)
            ).join('')}
        </div>

        <!-- CTA Section -->
        <div class="text-center mt-12 p-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 max-w-2xl mx-auto">
            <h2 class="text-2xl font-bold mb-4">Ready to Party in ${esc(cityName)}?</h2>
            <p class="text-gray-200 mb-6">
                Don't miss out on the best daytime disco and silent disco events in the area!
            </p>
            <a href="/#tickets" class="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                View All Events
            </a>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`✅ Created: ${citySlug}`);
}

console.log('📁 Location pages generation complete');