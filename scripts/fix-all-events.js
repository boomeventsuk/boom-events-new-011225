// scripts/fix-all-events.js
// Fix all event files: create missing JSON files and fix HTML lang attributes
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events.json');
const eventCopyPath = path.join(root, 'content', 'event-copy.json');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function withUkOffset(isoDateString) {
  const date = new Date(isoDateString);
  const ukOffset = '+01:00';
  return isoDateString.includes('+') || isoDateString.includes('Z') 
    ? isoDateString 
    : isoDateString + ukOffset;
}

const events = readJson(eventsPath);
const eventCopy = readJson(eventCopyPath) || {};

if (!events) {
  console.error('Could not read events.json');
  process.exit(1);
}

console.log(`Processing ${events.length} events...`);

let jsonCreated = 0;
let htmlFixed = 0;
const errors = [];

for (const event of events) {
  const eventSlug = event.slug || slugify(event.title);
  const eventDir = path.join(root, 'public', 'events', eventSlug);
  const htmlPath = path.join(eventDir, 'index.html');
  const jsonPath = path.join(eventDir, 'index.json');
  
  console.log(`\nProcessing: ${eventSlug}`);
  
  try {
    // Ensure directory exists
    ensureDir(eventDir);
    
    // Create JSON file if missing
    if (!fs.existsSync(jsonPath)) {
      const eventJson = {
        ...event,
        slug: eventSlug,
        shareUrl: `https://boomevents.co.uk/events/${eventSlug}/`,
        startDate: withUkOffset(event.start),
        endDate: withUkOffset(event.end)
      };
      
      fs.writeFileSync(jsonPath, JSON.stringify(eventJson, null, 2), 'utf8');
      console.log(`  ✓ Created JSON file`);
      jsonCreated++;
    } else {
      console.log(`  - JSON file exists`);
    }
    
    // Fix HTML lang attribute if needed
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (html.includes('lang="en"') && !html.includes('lang="en-GB"')) {
        html = html.replace('lang="en"', 'lang="en-GB"');
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log(`  ✓ Fixed HTML lang attribute`);
        htmlFixed++;
      } else if (html.includes('lang="en-GB"')) {
        console.log(`  - HTML lang already correct`);
      } else {
        console.log(`  ! HTML lang attribute not found`);
      }
    } else {
      console.log(`  ! HTML file missing`);
    }
    
  } catch (error) {
    errors.push({slug: eventSlug, error: error.message});
    console.log(`  ✗ Error: ${error.message}`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`JSON files created: ${jsonCreated}`);
console.log(`HTML files fixed: ${htmlFixed}`);
console.log(`Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log(`\nErrors encountered:`);
  errors.forEach(e => console.log(`  ${e.slug}: ${e.error}`));
}

console.log(`\nAll events processed successfully!`);