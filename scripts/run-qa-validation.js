// scripts/run-qa-validation.js
// Final QA validation for all events
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events.json');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateEvent(eventSlug) {
  const eventDir = path.join(root, 'public', 'events', eventSlug);
  const htmlFile = path.join(eventDir, 'index.html');
  const jsonFile = path.join(eventDir, 'index.json');
  
  const issues = [];
  
  // Check directory exists
  if (!fs.existsSync(eventDir)) {
    issues.push('Missing event directory');
    return issues;
  }
  
  // Check HTML file
  if (!fs.existsSync(htmlFile)) {
    issues.push('Missing index.html');
  } else {
    const html = fs.readFileSync(htmlFile, 'utf8');
    if (!/lang="en-GB"/.test(html)) {
      issues.push('HTML lang attribute not en-GB');
    }
  }
  
  // Check JSON file
  if (!fs.existsSync(jsonFile)) {
    issues.push('Missing index.json');
  } else {
    try {
      const json = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      if (!json.title || !json.start) {
        issues.push('JSON missing required fields (title/start)');
      }
      if (!json.slug) {
        issues.push('JSON missing slug field');
      }
      if (!json.shareUrl) {
        issues.push('JSON missing shareUrl field');
      }
    } catch (e) {
      issues.push(`Invalid JSON: ${e.message}`);
    }
  }
  
  return issues;
}

// Main validation
console.log('=== EVENT VALIDATION REPORT ===\n');

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
let passCount = 0;
let failCount = 0;
const allIssues = [];

for (const event of events) {
  const eventSlug = event.slug || slugify(event.title);
  const issues = validateEvent(eventSlug);
  
  if (issues.length === 0) {
    console.log(`✓ ${eventSlug}`);
    passCount++;
  } else {
    console.log(`✗ ${eventSlug}:`);
    issues.forEach(issue => console.log(`    - ${issue}`));
    failCount++;
    allIssues.push({slug: eventSlug, issues});
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total events: ${events.length}`);
console.log(`Passed validation: ${passCount}`);
console.log(`Failed validation: ${failCount}`);

// Additional checks
console.log(`\n=== ADDITIONAL CHECKS ===`);

// Check sitemap.xml exists
const sitemapPath = path.join(root, 'public', 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  console.log(`✓ sitemap.xml exists`);
} else {
  console.log(`✗ sitemap.xml missing`);
}

// Check venues.json exists
const venuesPath = path.join(root, 'public', 'venues.json');
if (fs.existsSync(venuesPath)) {
  console.log(`✓ venues.json exists`);
} else {
  console.log(`✗ venues.json missing`);
}

if (failCount === 0) {
  console.log(`\n🎉 ALL EVENTS PASSED VALIDATION!`);
  process.exit(0);
} else {
  console.log(`\n❌ ${failCount} events have issues that need fixing.`);
  process.exit(1);
}