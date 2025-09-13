const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// Read events data
const eventsData = JSON.parse(fs.readFileSync('public/events.json', 'utf8'));

// Read event copy
const eventCopy = JSON.parse(fs.readFileSync('content/event-copy.json', 'utf8'));

// Create events directory if it doesn't exist
const outputDir = 'public/events';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate sitemap URLs
let sitemapUrls = [];

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function createSlug(title) {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

function buildUtmUrl(baseUrl, eventTitle) {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'boombastic_event_page');
  url.searchParams.set('utm_medium', 'event_share');
  url.searchParams.set('utm_campaign', slugify(eventTitle, { lower: true, strict: true }));
  return url.toString();
}

// Generate event pages
eventsData.forEach(event => {
  const slug = createSlug(event.title);
  const eventDir = path.join(outputDir, slug);
  
  if (!fs.existsSync(eventDir)) {
    fs.mkdirSync(eventDir, { recursive: true });
  }

  const description = eventCopy[event.id.toString()] || event.description;
  const eventDate = formatDate(event.start);
  const eventTime = formatTime(event.start);
  const endTime = formatTime(event.end);
  
  // Create structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.start,
    "endDate": event.end,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.location
      }
    },
    "image": `https://boomevents.co.uk${event.image}`,
    "description": description,
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": "https://boomevents.co.uk"
    },
    "offers": {
      "@type": "Offer",
      "url": event.bookUrl,
      "price": "TBA",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    }
  };

  const shareUrl = `https://boomevents.co.uk/events/${slug}/`;
  const whatsappText = encodeURIComponent(`🎉 Check out this event: ${event.title}\\n\\n${shareUrl}`);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${event.title} | Boombastic Events</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="event">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${event.title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="https://boomevents.co.uk${event.image}">
    <meta property="og:site_name" content="Boombastic Events">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${shareUrl}">
    <meta property="twitter:title" content="${event.title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="https://boomevents.co.uk${event.image}">
    
    <!-- Canonical -->
    <link rel="canonical" href="${shareUrl}">
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
    </script>
    
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
                <img src="${event.image}" alt="${event.title}" class="w-full rounded-xl shadow-lg">
            </div>
            <div>
                <h1 class="text-3xl md:text-4xl font-bold mb-4">${event.title}</h1>
                <div class="text-lg text-gray-300 space-y-2 mb-6">
                    <p><strong>📅 Date:</strong> ${eventDate}</p>
                    <p><strong>⏰ Time:</strong> ${eventTime} - ${endTime}</p>
                    <p><strong>📍 Venue:</strong> ${event.location}</p>
                </div>
                
                <!-- Book Now Button -->
                <a href="${buildUtmUrl(event.bookUrl, event.title)}" 
                   target="_blank" 
                   class="btn-primary mb-4 block text-center"
                   onclick="gtag('event', 'book_now_click', { 'event_category': 'Event Page', 'event_label': '${event.title}' });">
                    🎫 Book Now
                </a>
                
                ${event.infoUrl ? `
                <a href="${event.infoUrl}" 
                   target="_blank" 
                   class="text-blue-400 hover:text-blue-300 block mb-4"
                   onclick="gtag('event', 'event_info_click', { 'event_category': 'Event Page', 'event_label': '${event.title}' });">
                    ℹ️ Event Info
                </a>
                ` : ''}
                
                <!-- Share Section -->
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-2">Share this event:</h3>
                    <div class="share-icons">
                        <a href="https://wa.me/?text=${whatsappText}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="gtag('event', 'whatsapp_share', { 'event_category': 'Event Page', 'event_label': '${event.title}' });"
                           title="Share on WhatsApp">
                            📱
                        </a>
                        <a href="${facebookShareUrl}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="gtag('event', 'facebook_share', { 'event_category': 'Event Page', 'event_label': '${event.title}' });"
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
            <p class="text-gray-300 text-lg leading-relaxed">${description}</p>
        </div>
        
        <!-- Call to Action -->
        <div class="text-center">
            <a href="${buildUtmUrl(event.bookUrl, event.title)}" 
               target="_blank" 
               class="btn-primary text-xl px-8 py-4"
               onclick="gtag('event', 'book_now_bottom_click', { 'event_category': 'Event Page', 'event_label': '${event.title}' });">
                🎫 Get Your Tickets Now
            </a>
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
                
                // Analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'copy_link', { 
                        'event_category': 'Event Page', 
                        'event_label': '${event.title}' 
                    });
                }
            });
        }
    </script>
    
    <!-- Google Analytics (if needed) -->
    <!-- Add your GA tracking code here -->
</body>
</html>`;

  // Write the HTML file
  fs.writeFileSync(path.join(eventDir, 'index.html'), htmlContent);
  
  // Add to sitemap
  sitemapUrls.push(`https://boomevents.co.uk/events/${slug}/`);
  
  console.log(`Generated page for: ${event.title}`);
});

// Update sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://boomevents.co.uk/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync('public/sitemap.xml', sitemap);

console.log(`Generated ${eventsData.length} event pages and updated sitemap.xml`);