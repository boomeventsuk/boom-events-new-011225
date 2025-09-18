// scripts/generate-complete-event-pages.js
// Complete event page generator with proper AEO/SEO optimization

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events.json');

if (!fs.existsSync(eventsPath)) {
  console.error('events.json not found at', eventsPath);
  process.exit(1);
}

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const generatedEvents = [];
const errors = [];

// Helper functions
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function formatTime(startStr, endStr) {
  if (!startStr || !endStr) return '';
  const start = new Date(startStr);
  const end = new Date(endStr);
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${startTime} - ${endTime}`;
}

// Process each event
for (const event of events) {
  try {
    const eventSlug = event.slug || slugify(event.title || `event-${event.id}`);
    const outDir = path.join(root, 'public', 'events', eventSlug);
    ensureDir(outDir);

    // Create enhanced JSON with computed fields
    const eventJson = {
      ...event,
      slug: eventSlug,
      shareUrl: `https://boomevents.co.uk/events/${eventSlug}/`,
      startDate: isoOrToISOString(event.start || ''),
      endDate: isoOrToISOString(event.end || '')
    };

    // Build JSON-LD with proper offers including price when available
    const offers = {
      "@type": "Offer",
      "url": event.bookUrl || eventJson.shareUrl,
      "priceCurrency": event.priceCurrency || "GBP",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    };

    // Only add price if numeric value exists
    if (event.price !== undefined && !isNaN(Number(event.price))) {
      offers.price = Number(event.price);
    }

    const jsonLD = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title || '',
      "startDate": eventJson.startDate,
      "endDate": eventJson.endDate,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "url": eventJson.shareUrl,
      "image": event.image || '',
      "description": event.description || '',
      "location": {
        "@type": "Place",
        "name": event.location || '',
        "address": {
          "@type": "PostalAddress",
          "addressLocality": (event.location || '').split(',').pop().trim(),
          "addressCountry": "GB"
        }
      },
      "offers": offers,
      "organizer": {
        "@type": "Organization",
        "name": "Boombastic Events",
        "url": "https://boomevents.co.uk"
      }
    };

    // Generate comprehensive HTML
    const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(event.title || 'Event')} | Boombastic Events</title>
    <meta name="description" content="${esc((event.description || '').substring(0, 160))}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="event">
    <meta property="og:url" content="${eventJson.shareUrl}">
    <meta property="og:title" content="${esc(event.title || '')}">
    <meta property="og:description" content="${esc((event.description || '').substring(0, 200))}">
    <meta property="og:image" content="${event.image || ''}">
    <meta property="og:site_name" content="Boombastic Events">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${eventJson.shareUrl}">
    <meta property="twitter:title" content="${esc(event.title || '')}">
    <meta property="twitter:description" content="${esc((event.description || '').substring(0, 200))}">
    <meta property="twitter:image" content="${event.image || ''}">
    
    <!-- Canonical -->
    <link rel="canonical" href="${eventJson.shareUrl}">
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Structured Data -->
    <script type="application/ld+json">${JSON.stringify(jsonLD, null, 2)}</script>
    
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
        .ticket-banner {
            background: linear-gradient(135deg, rgba(53, 167, 255, 0.1), rgba(255, 60, 172, 0.1));
            border: 1px solid rgba(53, 167, 255, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin: 16px 0;
            font-size: 14px;
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
                ${event.image ? `<img src="${event.image}" alt="${esc(event.title || '')}" class="w-full rounded-xl shadow-lg">` : ''}
            </div>
            <div>
                <h1 class="text-3xl md:text-4xl font-bold mb-4">${esc(event.title || '')}</h1>
                <div class="text-lg text-gray-300 space-y-2 mb-6">
                    <p><strong>📅 Date:</strong> ${formatDate(event.start)}</p>
                    <p><strong>⏰ Time:</strong> ${formatTime(event.start, event.end)}</p>
                    <p><strong>📍 Venue:</strong> ${esc(event.location || '')}</p>
                    ${event.price ? `<p><strong>🎫 Price:</strong> £${event.price}</p>` : ''}
                </div>
                
                <!-- Ticket Banner -->
                <div class="ticket-banner" aria-live="polite">
                    <strong>🎫 Tickets</strong>
                    <p>Group ticket offers available on each event page.</p>
                </div>
                
                <!-- Book Now Button -->
                ${event.bookUrl ? `
                <a href="${event.bookUrl}&utm_source=boombastic_event_page&utm_medium=event_share&utm_campaign=${eventSlug}" 
                   target="_blank" 
                   class="btn-primary mb-4 block text-center"
                   onclick="if(typeof gtag !== 'undefined') gtag('event', 'book_now_click', { 'event_category': 'Event Page', 'event_label': '${esc(event.title || '')}' });">
                    🎫 Book Now
                </a>
                ` : ''}
                
                ${event.infoUrl ? `
                <a href="${event.infoUrl}" 
                   target="_blank" 
                   class="text-blue-400 hover:text-blue-300 block mb-4"
                   onclick="if(typeof gtag !== 'undefined') gtag('event', 'event_info_click', { 'event_category': 'Event Page', 'event_label': '${esc(event.title || '')}' });">
                    ℹ️ Event Info
                </a>
                ` : ''}
                
                <!-- Share Section -->
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-2">Share this event:</h3>
                    <div class="share-icons">
                        <a href="https://wa.me/?text=🎉 Check out this event: ${encodeURIComponent(event.title || '')}%0A%0A${encodeURIComponent(eventJson.shareUrl)}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="if(typeof gtag !== 'undefined') gtag('event', 'whatsapp_share', { 'event_category': 'Event Page', 'event_label': '${esc(event.title || '')}' });"
                           title="Share on WhatsApp">
                            📱
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventJson.shareUrl)}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="if(typeof gtag !== 'undefined') gtag('event', 'facebook_share', { 'event_category': 'Event Page', 'event_label': '${esc(event.title || '')}' });"
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
            <p class="text-gray-300 text-lg leading-relaxed">${esc(event.description || '')}</p>
        </div>
        
        <!-- FAQ Section -->
        <div class="bg-gray-800 rounded-xl p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div class="space-y-4">
                <div>
                    <h3 class="text-lg font-semibold text-blue-400 mb-2">What should I bring?</h3>
                    <p class="text-gray-300">Just bring yourself and your dancing shoes! We provide all the equipment including glowing headphones for silent disco events.</p>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-blue-400 mb-2">Are group bookings available?</h3>
                    <p class="text-gray-300">Yes! Contact us for group discounts and special arrangements for parties of 6 or more.</p>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-blue-400 mb-2">What's the age restriction?</h3>
                    <p class="text-gray-300">Most events are 18+ unless specified as family-friendly. Check the event description for specific age requirements.</p>
                </div>
            </div>
        </div>
        
        <!-- JSON Link -->
        <div class="text-center mb-8">
            <p class="text-sm text-gray-400">
                <a href="/events/${eventSlug}/index.json" rel="nofollow" class="text-blue-400 hover:text-blue-300">
                    View event data (JSON)
                </a>
            </p>
        </div>
        
        <!-- Call to Action -->
        <div class="text-center">
            ${event.bookUrl ? `
            <a href="${event.bookUrl}&utm_source=boombastic_event_page&utm_medium=event_share&utm_campaign=${eventSlug}" 
               target="_blank" 
               class="btn-primary text-xl px-8 py-4"
               onclick="if(typeof gtag !== 'undefined') gtag('event', 'book_now_bottom_click', { 'event_category': 'Event Page', 'event_label': '${esc(event.title || '')}' });">
                🎫 Get Your Tickets Now
            </a>
            ` : ''}
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
                        'event_label': '${esc(event.title || '')}'
                    });
                }
            });
        }
    </script>
</body>
</html>`;

    // Write files
    fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(eventJson, null, 2), 'utf8');
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    generatedEvents.push({
      slug: eventSlug,
      title: event.title,
      status: 'success',
      price: event.price || null,
      hasBookUrl: !!event.bookUrl,
      hasImage: !!event.image
    });

    console.log(`✅ Generated: ${eventSlug}`);

  } catch (error) {
    errors.push({
      event: event.title || event.id,
      error: error.message
    });
    console.error(`❌ Failed: ${event.title || event.id} - ${error.message}`);
  }
}

console.log(`\n📊 GENERATION COMPLETE`);
console.log(`✅ Success: ${generatedEvents.length}`);
console.log(`❌ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(err => console.log(`  - ${err.event}: ${err.error}`));
  process.exit(1);
}

// Write generation report
const report = {
  timestamp: new Date().toISOString(),
  totalEvents: events.length,
  generated: generatedEvents.length,
  errors: errors.length,
  events: generatedEvents,
  errorDetails: errors
};

fs.writeFileSync(
  path.join(root, 'automation', 'generation-report-20250118-140532.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('\n📄 Report saved: automation/generation-report-20250118-140532.json');
process.exit(0);