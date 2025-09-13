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

// Generate event pages with proper styling
events.forEach(ev => {
  const slug = ev.slug || (ev.title ? ev.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') : (ev.id || 'event'));
  const desc = copy[String(ev.id)] || copy[slug] || ev.description || '';
  
  // Enhanced HTML generation with proper image handling
  const { venue, city } = splitVenueAndCity(ev.location || '');
  const start = withUkOffset(ev.start);
  const end = withUkOffset(ev.end);
  const shareUrl = 'https://boomevents.co.uk/events/' + slug + '/';
  const imageAbs = ev.image ? (ev.image.startsWith('http') ? ev.image : 'https://boomevents.co.uk' + ev.image) : '';
  const offers = { "@type":"Offer", "url": ev.bookUrl || '', "availability":"https://schema.org/InStock", "priceCurrency":"GBP" };
  if (ev.price !== undefined && ev.price !== null && !isNaN(Number(ev.price))) offers.price = Number(ev.price);

  const structured = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.title || '',
    "startDate": start,
    "endDate": end,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": { "@type":"Place", "name": venue || (ev.location || ''), "address": { "@type":"PostalAddress", "addressLocality": city || '', "addressCountry":"GB" } },
    "image": imageAbs,
    "description": desc || ev.description || '',
    "organizer": { "@type":"Organization", "name":"Boombastic Events", "url":"https://boomevents.co.uk" },
    "offers": offers
  };
  
  const breadcrumb = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Home","item":"https://boomevents.co.uk/"},
      {"@type":"ListItem","position":2,"name":"Events","item":"https://boomevents.co.uk/events/"},
      {"@type":"ListItem","position":3,"name": ev.title || 'Event', "item": shareUrl}
    ]
  };

  const dateRead = fdate(ev.start || '');
  const startTime = ftime(ev.start || '');
  const endTime = ftime(ev.end || '');
  
  const utmUrl = ev.bookUrl ? (() => {
    try {
      const url = new URL(ev.bookUrl);
      url.searchParams.set('utm_source', 'boombastic_event_page');
      url.searchParams.set('utm_medium', 'event_share');
      url.searchParams.set('utm_campaign', slug);
      return url.toString();
    } catch (e) {
      return ev.bookUrl;
    }
  })() : '';
  
  const whatsappText = encodeURIComponent(`🎉 Check out this event: ${ev.title || ''}\\n\\n${shareUrl}`);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ev.title || 'Event'} | Boombastic Events</title>
    <meta name="description" content="${desc || ev.description || ''}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="event">
    <meta property="og:url" content="${shareUrl}">
    <meta property="og:title" content="${ev.title || 'Event'}">
    <meta property="og:description" content="${desc || ev.description || ''}">
    <meta property="og:image" content="${imageAbs}">
    <meta property="og:site_name" content="Boombastic Events">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${shareUrl}">
    <meta property="twitter:title" content="${ev.title || 'Event'}">
    <meta property="twitter:description" content="${desc || ev.description || ''}">
    <meta property="twitter:image" content="${imageAbs}">
    
    <!-- Canonical -->
    <link rel="canonical" href="${shareUrl}">
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Structured Data -->
    <script type="application/ld+json">${JSON.stringify(structured)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
    
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
                <img src="${ev.image}" alt="${ev.title || 'Event'}" class="w-full rounded-xl shadow-lg event-image">
            </div>
            <div>
                <h1 class="text-3xl md:text-4xl font-bold mb-4">${ev.title || 'Event'}</h1>
                <div class="text-lg text-gray-300 space-y-2 mb-6">
                    <p><strong>📅 Date:</strong> ${dateRead}</p>
                    <p><strong>⏰ Time:</strong> ${startTime} - ${endTime}</p>
                    <p><strong>📍 Venue:</strong> ${venue || ev.location}</p>
                </div>
                
                <!-- Book Now Button -->
                ${ev.bookUrl ? `<a href="${utmUrl || ev.bookUrl}" 
                   target="_blank" 
                   class="btn-primary mb-4 block text-center"
                   onclick="if(typeof gtag !== 'undefined') gtag('event', 'book_now_click', { 'event_category': 'Event Page', 'event_label': '${ev.title}' });">
                    🎫 Book Now
                </a>` : ''}
                
                <!-- Share Section -->
                <div class="mt-6">
                    <h3 class="text-lg font-semibold mb-2">Share this event:</h3>
                    <div class="share-icons">
                        <a href="https://wa.me/?text=${whatsappText}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="if(typeof gtag !== 'undefined') gtag('event', 'whatsapp_share', { 'event_category': 'Event Page', 'event_label': '${ev.title}' });"
                           title="Share on WhatsApp">
                            📱
                        </a>
                        <a href="${facebookShareUrl}" 
                           target="_blank" 
                           class="icon-btn"
                           onclick="if(typeof gtag !== 'undefined') gtag('event', 'facebook_share', { 'event_category': 'Event Page', 'event_label': '${ev.title}' });"
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
            <p class="text-gray-300 text-lg leading-relaxed">${desc || ev.description || ''}</p>
        </div>
        
        <!-- Call to Action -->
        <div class="text-center">
            ${ev.bookUrl ? `<a href="${utmUrl || ev.bookUrl}" 
               target="_blank" 
               class="btn-primary text-xl px-8 py-4"
               onclick="if(typeof gtag !== 'undefined') gtag('event', 'book_now_bottom_click', { 'event_category': 'Event Page', 'event_label': '${ev.title}' });">
                🎫 Get Your Tickets Now
            </a>` : ''}
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
                        'event_label': '${ev.title || ''}'
                    });
                }
            });
        }
    </script>
</body>
</html>`;

  const dir = path.join(outDir, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir,'index.html'), html, 'utf8');
  console.log('Generated event page:', slug);
});
console.log('Event generation complete.');