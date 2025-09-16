// scripts/quick-check-events.js
// Quick check of event file status
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events.json');
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

console.log(`Checking ${events.length} events...\n`);

let htmlCount = 0;
let jsonCount = 0;
let correctLangCount = 0;
const missing = [];

for (const event of events) {
  const eventSlug = event.slug || slugify(event.title);
  const eventDir = path.join(root, 'public', 'events', eventSlug);
  const htmlFile = path.join(eventDir, 'index.html');
  const jsonFile = path.join(eventDir, 'index.json');
  
  const hasHtml = fs.existsSync(htmlFile);
  const hasJson = fs.existsSync(jsonFile);
  
  if (hasHtml) htmlCount++;
  if (hasJson) jsonCount++;
  
  if (hasHtml) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    if (/lang="en-GB"/.test(html)) {
      correctLangCount++;
    }
  }
  
  if (!hasHtml || !hasJson) {
    missing.push({
      slug: eventSlug,
      title: event.title,
      hasHtml,
      hasJson
    });
  }
}

console.log(`Status Summary:`);
console.log(`- Total events: ${events.length}`);
console.log(`- HTML files: ${htmlCount}/${events.length}`);
console.log(`- JSON files: ${jsonCount}/${events.length}`);
console.log(`- Correct lang attribute: ${correctLangCount}/${events.length}`);
console.log(`- Missing files: ${missing.length}`);

if (missing.length > 0) {
  console.log(`\nMissing event files:`);
  missing.forEach(m => {
    console.log(`  ${m.slug}: HTML=${m.hasHtml ? '✓' : '✗'}, JSON=${m.hasJson ? '✓' : '✗'}`);
  });
}