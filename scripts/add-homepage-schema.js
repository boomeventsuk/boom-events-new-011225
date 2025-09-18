// scripts/add-homepage-schema.js  
// Adds LocalBusiness and FAQ schema to homepage

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// LocalBusiness JSON-LD (email-only as specified)
const localBusinessLD = `
    <!-- LocalBusiness JSON-LD -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Boombastic Events",
      "url": "https://boomevents.co.uk",
      "email": "events@boomevents.co.uk",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "GB"
      },
      "areaServed": {
        "@type": "Country",
        "name": "United Kingdom"
      },
      "description": "Daytime Disco, Silent Disco & Decades parties across Birmingham, Bedford, Milton Keynes, Coventry & Luton."
    }
    </script>`;

// FAQ JSON-LD
const faqLD = `
    <!-- FAQ JSON-LD -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What makes Boombastic Events different?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We specialize in daytime events that deliver full club energy without the late-night commitment. From silent disco battles with three channels to decade-spanning daytime discos with confetti cannons, we create unforgettable experiences that let you party hard and still be home for dinner."
          }
        },
        {
          "@type": "Question", 
          "name": "Are group bookings available?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! We offer special group rates and arrangements for parties of 6 or more. Contact us through our booking links for group discounts and to ensure your crew gets the best experience possible."
          }
        },
        {
          "@type": "Question",
          "name": "What should I expect at a silent disco event?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Silent disco events feature three DJ channels playing different genres - pop, indie, and dance. You receive glowing headphones and can switch between channels anytime. Expect hilarious moments when everyone suddenly switches to the same epic song, plus the unique joy of singing along to something totally different from your mates."
          }
        }
      ]
    }
    </script>`;

// Insert schema before closing head tag
html = html.replace('</head>', localBusinessLD + faqLD + '\\n  </head>');

// Add FAQ section before the closing body tag (find a good spot in the existing structure)
const faqSection = `
        <!-- FAQ Section -->
        <section class="py-16 bg-secondary/5">
            <div class="container mx-auto px-4">
                <div class="text-center mb-12">
                    <h2 class="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                    <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Everything you need to know about our daytime disco and silent disco events
                    </p>
                </div>
                
                <div class="max-w-3xl mx-auto space-y-6">
                    <div class="bg-card rounded-lg p-6 border">
                        <h3 class="text-xl font-semibold mb-3 text-primary">What makes Boombastic Events different?</h3>
                        <p class="text-muted-foreground">We specialize in daytime events that deliver full club energy without the late-night commitment. From silent disco battles with three channels to decade-spanning daytime discos with confetti cannons, we create unforgettable experiences that let you party hard and still be home for dinner.</p>
                    </div>
                    
                    <div class="bg-card rounded-lg p-6 border">
                        <h3 class="text-xl font-semibold mb-3 text-primary">Are group bookings available?</h3>
                        <p class="text-muted-foreground">Yes! We offer special group rates and arrangements for parties of 6 or more. Contact us through our booking links for group discounts and to ensure your crew gets the best experience possible.</p>
                    </div>
                    
                    <div class="bg-card rounded-lg p-6 border">
                        <h3 class="text-xl font-semibold mb-3 text-primary">What should I expect at a silent disco event?</h3>
                        <p class="text-muted-foreground">Silent disco events feature three DJ channels playing different genres - pop, indie, and dance. You receive glowing headphones and can switch between channels anytime. Expect hilarious moments when everyone suddenly switches to the same epic song, plus the unique joy of singing along to something totally different from your mates.</p>
                    </div>
                </div>
            </div>
        </section>`;

// Find a good insertion point (before closing body or footer)
if (html.includes('</body>')) {
  html = html.replace('</body>', faqSection + '\\n  </body>');
} else {
  // Fallback - add before the end
  html = html + faqSection;
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Added LocalBusiness and FAQ schema to homepage');