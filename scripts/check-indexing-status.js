#!/usr/bin/env node

// scripts/check-indexing-status.js
// Quick script to validate SEO/indexing readiness

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking indexing readiness...\n');

const root = path.resolve(__dirname, '..');
let score = 0;
const maxScore = 10;

// Check robots.txt
const robotsPath = path.join(root, 'public', 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (robots.includes('Allow: /') && robots.includes('Sitemap:')) {
    console.log('✅ robots.txt: Configured correctly');
    score++;
  } else {
    console.log('⚠️  robots.txt: Missing Allow or Sitemap directive');
  }
} else {
  console.log('❌ robots.txt: Not found');
}

// Check sitemap.xml
const sitemapPath = path.join(root, 'public', 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (sitemap.includes('boomevents.co.uk') && sitemap.includes('/events/')) {
    console.log('✅ sitemap.xml: Contains events and domain');
    score++;
  } else {
    console.log('⚠️  sitemap.xml: Missing domain or events');
  }
} else {
  console.log('❌ sitemap.xml: Not found');
}

// Check index.html for SEO elements
const indexPath = path.join(root, 'index.html');
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');
  
  // Check lang attribute
  if (html.includes('lang="en-GB"')) {
    console.log('✅ HTML lang: Set to en-GB');
    score++;
  } else {
    console.log('⚠️  HTML lang: Missing or incorrect');
  }
  
  // Check canonical URL
  if (html.includes('rel="canonical"')) {
    console.log('✅ Canonical URL: Present');
    score++;
  } else {
    console.log('❌ Canonical URL: Missing');
  }
  
  // Check meta description
  if (html.includes('name="description"')) {
    console.log('✅ Meta description: Present');
    score++;
  } else {
    console.log('❌ Meta description: Missing');
  }
  
  // Check OpenGraph
  if (html.includes('property="og:title"') && html.includes('property="og:description"')) {
    console.log('✅ OpenGraph tags: Present');
    score++;
  } else {
    console.log('❌ OpenGraph tags: Missing');
  }
  
  // Check structured data
  if (html.includes('application/ld+json')) {
    console.log('✅ JSON-LD structured data: Present');
    score++;
  } else {
    console.log('❌ JSON-LD: Missing');
  }
  
  // Check search verification
  if (html.includes('google-site-verification') || html.includes('msvalidate.01')) {
    console.log('✅ Search engine verification: Meta tags present');
    score++;
  } else {
    console.log('⚠️  Search verification: No verification tags found');
  }
} else {
  console.log('❌ index.html: Not found');
}

// Check events-boombastic.json feed
const eventsPath = path.join(root, 'public', 'events-boombastic.json');
if (fs.existsSync(eventsPath)) {
  try {
    const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    if (Array.isArray(events) && events.length > 0) {
      console.log(`✅ events-boombastic.json: ${events.length} events available`);
      score++;
    } else {
      console.log('⚠️  events-boombastic.json: Empty or invalid format');
    }
  } catch (e) {
    console.log('❌ events-boombastic.json: Invalid JSON');
  }
} else {
  console.log('❌ events-boombastic.json: Not found');
}

// Check for-ai page
const forAiPath = path.join(root, 'public', 'for-ai', 'index.html');
if (fs.existsSync(forAiPath)) {
  console.log('✅ AI discovery page: /for-ai/ exists');
  score++;
} else {
  console.log('❌ AI discovery: /for-ai/ page missing');
}

// Summary
console.log(`\n📊 Indexing Readiness Score: ${score}/${maxScore}`);

if (score >= 8) {
  console.log('🚀 Excellent! Your site is ready for indexing.');
  console.log('📝 Next: Set up Google Search Console and submit sitemap');
} else if (score >= 6) {
  console.log('⚠️  Good foundation, but some improvements needed');
} else {
  console.log('❌ Critical SEO elements missing - fix before submitting for indexing');
}

console.log('\n💡 Tips:');
console.log('   - Add verification meta tags after setting up Search Console');
console.log('   - Submit sitemap.xml via Google Search Console');
console.log('   - Monitor indexing progress in webmaster tools');
console.log('   - Check /indexing-status/ page for detailed guidance');

process.exit(score < 6 ? 1 : 0);