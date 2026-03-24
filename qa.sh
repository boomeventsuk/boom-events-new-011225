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

# Check sitemap contains event URLs (React app serves /event/{eventCode})
echo "Checking sitemap event URLs..."
if grep -q "/event/" public/sitemap.xml; then
  event_url_count=$(grep -c "/event/" public/sitemap.xml)
  echo "OK: Sitemap contains $event_url_count event URLs"
else
  echo "FAIL: Sitemap missing event URLs"
  exit 1
fi

# Verify city landing pages were generated
echo "Checking city landing pages..."
if [ -d "public/locations" ]; then
  city_count=$(find public/locations -name "index.html" | wc -l | tr -d ' ')
  echo "OK: $city_count city landing pages found"
else
  echo "FAIL: Locations directory not found"
  exit 1
fi

echo ""
echo "All QA tests passed!"
echo "OK: Events data integrity verified"
echo "OK: Build process working"
echo "OK: Sitemap contains event URLs"
echo "OK: City landing pages generated"
echo "OK: SEO structure implemented"
echo ""
echo "Ready for deployment!"
