#!/bin/bash

# Quality Assurance Testing Script for Boombastic Events

echo "Running QA Tests for Boombastic Events..."

# Check if required files exist
echo "Checking required files..."
required_files=(
  "public/events-boombastic.json"
  "content/event-copy.json"
  "scripts/generate-event-pages.js"
  "scripts/merge-event-copy.js"
  "public/sitemap.xml"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "OK: $file exists"
  else
    echo "FAIL: $file missing"
    exit 1
  fi
done

# Test events-boombastic.json structure
echo "Testing events-boombastic.json structure..."
node -e "
const events = JSON.parse(require('fs').readFileSync('public/events-boombastic.json', 'utf8'));
console.log('Events loaded:', events.length);

const requiredFields = ['eventCode', 'title', 'city', 'start', 'end', 'eventbriteId', 'image', 'description'];
events.forEach((event, index) => {
  requiredFields.forEach(field => {
    if (!event[field]) {
      console.log('FAIL: Event', index + 1, 'missing field:', field);
      process.exit(1);
    }
  });
});
console.log('OK: All events have required fields');

// Check for a Milton Keynes event
const mkEvent = events.find(e => e.title && e.title.toUpperCase().includes('MILTON KEYNES'));
if (mkEvent) {
  console.log('OK: Milton Keynes event found:', mkEvent.eventCode);
} else {
  console.log('FAIL: No Milton Keynes event found in events-boombastic.json');
  process.exit(1);
}
"

# Test event descriptions are populated
echo "Testing event descriptions..."
node -e "
const events = JSON.parse(require('fs').readFileSync('public/events-boombastic.json', 'utf8'));

events.forEach(event => {
  if (!event.description || event.description.trim().length === 0) {
    console.log('FAIL: Event', event.eventCode, 'has no description');
    process.exit(1);
  }
});
console.log('OK: All events have descriptions');
"

# Test build process
echo "Testing build process..."
if npm run build; then
  echo "OK: Build successful"
else
  echo "FAIL: Build failed"
  exit 1
fi

# Check if event pages were generated
echo "Checking generated event pages..."
if [ -d "public/events" ]; then
  page_count=$(find public/events -name "index.html" | wc -l | tr -d ' ')
  expected=$(node -e "
const events = JSON.parse(require('fs').readFileSync('public/events-boombastic.json', 'utf8'));
function slugify(s){return (s||'').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+\$/g,'');}
const slugs = new Set(events.map(ev => ev.slug || slugify(ev.title)));
console.log(slugs.size);
")
  echo "OK: Generated $page_count event pages (expected $expected unique slugs)"

  if [ "$page_count" -lt "$expected" ]; then
    echo "FAIL: Expected $expected event pages, found $page_count"
    exit 1
  fi
else
  echo "FAIL: Events directory not found"
  exit 1
fi

# Test sitemap
echo "Testing sitemap..."
if grep -q "events/" public/sitemap.xml; then
  echo "OK: Sitemap contains event URLs"
else
  echo "FAIL: Sitemap missing event URLs"
  exit 1
fi

# Test URL structure
echo "Testing URL structure..."
node -e "
const events = JSON.parse(require('fs').readFileSync('public/events-boombastic.json', 'utf8'));

function slugify(s) {
  return (s || '').toString().toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+\$/g, '');
}

events.forEach(event => {
  const slug = event.slug || slugify(event.title);
  const expectedPath = 'public/events/' + slug + '/index.html';

  if (require('fs').existsSync(expectedPath)) {
    console.log('OK: Event page exists:', slug);
  } else {
    console.log('FAIL: Event page missing:', expectedPath);
    process.exit(1);
  }
});
console.log('OK: All event page URLs are correctly structured');
"

echo ""
echo "All QA tests passed!"
echo "OK: Events data integrity verified"
echo "OK: Build process working"
echo "OK: Event pages generated"
echo "OK: SEO structure implemented"
echo "OK: URL structure validated"
echo ""
echo "Ready for deployment!"
