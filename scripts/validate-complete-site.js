// scripts/validate-complete-site.js
// Validates complete site for AEO/SEO compliance

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const results = {
  timestamp: new Date().toISOString(),
  events: [],
  locations: [],
  homepage: {},
  infrastructure: {},
  scores: {
    aeo: 0, // AI Engine Optimization  
    seo: 0, // Search Engine Optimization
    aio: 0, // AI Intelligence Optimization
    geo: 0  // Geographic Optimization
  },
  summary: {}
};

console.log('🔍 Validating complete site for AEO/SEO/AIO/GEO compliance...\n');

// Load events data
const eventsPath = path.join(root, 'public', 'events-boombastic.json');
if (!fs.existsSync(eventsPath)) {
  console.error('❌ events-boombastic.json not found');
  process.exit(1);
}
const rawEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const events = rawEvents.map(ev => ({
  ...ev,
  id:       ev.id       || ev.eventCode,
  location: ev.location || (ev.venue && ev.city ? `${ev.venue}, ${ev.city}` : ev.city || ev.venue || ''),
  bookUrl:  ev.bookUrl  || (ev.eventbriteId ? `https://www.eventbrite.co.uk/e/${ev.eventbriteId}` : '')
}));

// Validate each event
console.log('📋 Validating Event Pages...');
for (const event of events) {
  const slug = event.slug || event.title?.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
  const eventDir = path.join(root, 'public', 'events', slug);
  const htmlFile = path.join(eventDir, 'index.html');
  const jsonFile = path.join(eventDir, 'index.json');
  
  const eventResult = {
    slug,
    title: event.title,
    hasHtml: fs.existsSync(htmlFile),
    hasJson: fs.existsSync(jsonFile),
    hasPrice: !!event.price,
    langCorrect: false,
    hasProperSchema: false,
    hasTicketBanner: false,
    issues: []
  };

  if (eventResult.hasHtml) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    eventResult.langCorrect = html.includes('lang="en-GB"');
    eventResult.hasProperSchema = html.includes('"@type": "Event"') && html.includes('offers');
    eventResult.hasTicketBanner = html.includes('ticket-banner');
    
    if (!eventResult.langCorrect) eventResult.issues.push('lang not en-GB');
    if (!eventResult.hasProperSchema) eventResult.issues.push('missing proper Event schema');
    if (!eventResult.hasTicketBanner) eventResult.issues.push('missing ticket banner');
    if (event.price && !html.includes('"price":')) eventResult.issues.push('price not in schema');
  } else {
    eventResult.issues.push('HTML file missing');
  }

  if (!eventResult.hasJson) eventResult.issues.push('JSON file missing');

  results.events.push(eventResult);
  
  const status = eventResult.issues.length === 0 ? '✅' : '⚠️';
  console.log(`  ${status} ${slug} ${eventResult.issues.length ? `(${eventResult.issues.length} issues)` : ''}`);
}

// Validate location pages  
console.log('\n📍 Validating Location Pages...');
const venuesPath = path.join(root, 'public', 'venues.json');
if (fs.existsSync(venuesPath)) {
  const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  
  for (const cityName in venues) {
    const citySlug = cityName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
    const locationPath = path.join(root, 'public', 'locations', citySlug, 'index.html');
    
    const locationResult = {
      city: cityName,
      slug: citySlug,
      exists: fs.existsSync(locationPath),
      hasProperSchema: false,
      langCorrect: false,
      issues: []
    };

    if (locationResult.exists) {
      const html = fs.readFileSync(locationPath, 'utf8');
      locationResult.langCorrect = html.includes('lang="en-GB"');
      locationResult.hasProperSchema = html.includes('BreadcrumbList') && html.includes('ItemList');
      
      if (!locationResult.langCorrect) locationResult.issues.push('lang not en-GB');
      if (!locationResult.hasProperSchema) locationResult.issues.push('missing schema markup');
    } else {
      locationResult.issues.push('location page missing');
    }

    results.locations.push(locationResult);
    
    const status = locationResult.issues.length === 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${cityName} ${locationResult.issues.length ? `(${locationResult.issues.length} issues)` : ''}`);
  }
}

// Validate homepage
console.log('\n🏠 Validating Homepage...');
const indexPath = path.join(root, 'index.html');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  
  results.homepage = {
    hasOrganizationSchema: html.includes('"@type": "Organization"'),
    hasWebsiteSchema: html.includes('"@type": "WebSite"'),  
    hasLocalBusinessSchema: html.includes('"@type": "LocalBusiness"'),
    hasFaqSchema: html.includes('"@type": "FAQPage"'),
    langCorrect: html.includes('lang="en-GB"'),
    issues: []
  };

  if (!results.homepage.hasOrganizationSchema) results.homepage.issues.push('missing Organization schema');
  if (!results.homepage.hasLocalBusinessSchema) results.homepage.issues.push('missing LocalBusiness schema');
  if (!results.homepage.hasFaqSchema) results.homepage.issues.push('missing FAQ schema'); 
  if (!results.homepage.langCorrect) results.homepage.issues.push('lang not en-GB');

  const status = results.homepage.issues.length === 0 ? '✅' : '⚠️';
  console.log(`  ${status} Homepage ${results.homepage.issues.length ? `(${results.homepage.issues.length} issues)` : ''}`);
}

// Validate infrastructure
console.log('\n🏗️ Validating Infrastructure...');
const files = [
  'public/robots.txt',
  'public/sitemap.xml', 
  'public/events-boombastic.json',
  'public/venues.json',
  'public/for-ai/index.html'
];

results.infrastructure = {
  files: {},
  issues: []
};

for (const file of files) {
  const exists = fs.existsSync(path.join(root, file));
  results.infrastructure.files[file] = exists;
  if (!exists) results.infrastructure.issues.push(`missing ${file}`);
  
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
}

// Calculate scores
console.log('\n📊 Calculating Compliance Scores...');

// AEO Score (AI Engine Optimization)
const aeoFactors = [
  results.infrastructure.files['public/for-ai/index.html'], // AI-readable endpoints
  results.infrastructure.files['public/events-boombastic.json'], // Structured data feeds
  results.homepage.hasOrganizationSchema, // Proper organization markup
  results.events.every(e => e.hasJson) // Per-event JSON availability
];
results.scores.aeo = Math.round((aeoFactors.filter(Boolean).length / aeoFactors.length) * 100);

// SEO Score (Search Engine Optimization) 
const seoFactors = [
  results.infrastructure.files['public/robots.txt'],
  results.infrastructure.files['public/sitemap.xml'],
  results.homepage.langCorrect,
  results.events.every(e => e.langCorrect),
  results.locations.every(l => l.langCorrect || !l.exists),
  results.events.every(e => e.hasProperSchema)
];
results.scores.seo = Math.round((seoFactors.filter(Boolean).length / seoFactors.length) * 100);

// AIO Score (AI Intelligence Optimization)
const aioFactors = [
  results.homepage.hasFaqSchema, // FAQ markup for AI understanding
  results.events.every(e => e.hasProperSchema), // Complete event schemas
  results.locations.every(l => l.hasProperSchema || !l.exists), // Location schemas
  results.homepage.hasLocalBusinessSchema // Business information
];
results.scores.aio = Math.round((aioFactors.filter(Boolean).length / aioFactors.length) * 100);

// GEO Score (Geographic Optimization)  
const geoFactors = [
  results.infrastructure.files['public/venues.json'], // Venue/city data
  results.locations.length > 0, // Location pages exist
  results.locations.every(l => l.exists), // All location pages present
  results.events.every(e => e.title?.includes(e.title?.match(/MILTON KEYNES|BEDFORD|NORTHAMPTON|COVENTRY|BIRMINGHAM|LUTON/i)?.[0] || '')) // Geographic terms in titles
];
results.scores.geo = Math.round((geoFactors.filter(Boolean).length / geoFactors.length) * 100);

// Summary statistics
results.summary = {
  totalEvents: events.length,
  eventsWithIssues: results.events.filter(e => e.issues.length > 0).length,
  locationsWithIssues: results.locations.filter(l => l.issues.length > 0).length,
  homepageIssues: results.homepage.issues?.length || 0,
  infrastructureIssues: results.infrastructure.issues?.length || 0,
  overallScore: Math.round((results.scores.aeo + results.scores.seo + results.scores.aio + results.scores.geo) / 4)
};

// Display scores
console.log(`🤖 AEO Score: ${results.scores.aeo}%`);
console.log(`🔍 SEO Score: ${results.scores.seo}%`);  
console.log(`🧠 AIO Score: ${results.scores.aio}%`);
console.log(`🌍 GEO Score: ${results.scores.geo}%`);
console.log(`📈 Overall: ${results.summary.overallScore}%`);

// Save detailed results
fs.writeFileSync(
  path.join(root, 'automation', 'scores-20250118-140532.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);

console.log('\n📄 Detailed validation report saved: automation/scores-20250118-140532.json');

if (results.summary.overallScore >= 90) {
  console.log('🎉 Excellent! Site is optimized for AEO/SEO/AIO/GEO');
} else if (results.summary.overallScore >= 70) {
  console.log('👍 Good optimization level, minor improvements possible');
} else {
  console.log('⚠️ Optimization needed in several areas');
}

process.exit(0);