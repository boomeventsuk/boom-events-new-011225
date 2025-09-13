#!/bin/bash

# Quality Assurance Testing Script for Boombastic Events

echo "🎯 Running QA Tests for Boombastic Events..."

# Check if required files exist
echo "📁 Checking required files..."
required_files=(
  "public/events.json"
  "content/event-copy.json"
  "scripts/generate-event-pages.js"
  "scripts/merge-event-copy.js"
  "public/sitemap.xml"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    exit 1
  fi
done

# Test events.json structure
echo "📊 Testing events.json structure..."
node -e "
const events = JSON.parse(require('fs').readFileSync('public/events.json', 'utf8'));
console.log('✅ Events loaded:', events.length);

const requiredFields = ['id', 'title', 'location', 'start', 'end', 'bookUrl', 'image', 'description'];
events.forEach((event, index) => {
  requiredFields.forEach(field => {
    if (!event[field]) {
      console.log('❌ Event', index + 1, 'missing field:', field);
      process.exit(1);
    }
  });
});
console.log('✅ All events have required fields');

// Check for ID 2 (Silent Disco MK)
const hasId2 = events.find(e => e.id === 2);
if (hasId2) {
  console.log('✅ Silent Disco MK event (ID 2) found');
} else {
  console.log('❌ Silent Disco MK event (ID 2) missing');
  process.exit(1);
}
"

# Test event copy integration
echo "📝 Testing event copy integration..."
node -e "
const events = JSON.parse(require('fs').readFileSync('public/events.json', 'utf8'));
const copy = JSON.parse(require('fs').readFileSync('content/event-copy.json', 'utf8'));

events.forEach(event => {
  if (copy[event.id.toString()]) {
    if (event.description === copy[event.id.toString()]) {
      console.log('✅ Event', event.id, 'copy integrated');
    } else {
      console.log('❌ Event', event.id, 'copy mismatch');
      process.exit(1);
    }
  }
});
console.log('✅ All event copy integrated successfully');
"

# Test build process
echo "🔨 Testing build process..."
if npm run build; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi

# Check if event pages were generated
echo "📄 Checking generated event pages..."
if [ -d "public/events" ]; then
  page_count=$(find public/events -name "index.html" | wc -l)
  echo "✅ Generated $page_count event pages"
  
  if [ "$page_count" -lt 17 ]; then
    echo "❌ Expected 17+ event pages, found $page_count"
    exit 1
  fi
else
  echo "❌ Events directory not found"
  exit 1
fi

# Test sitemap
echo "🗺️  Testing sitemap..."
if grep -q "events/" public/sitemap.xml; then
  echo "✅ Sitemap contains event URLs"
else
  echo "❌ Sitemap missing event URLs"
  exit 1
fi

# Test URL structure
echo "🔗 Testing URL structure..."
node -e "
const slugify = require('slugify');
const events = JSON.parse(require('fs').readFileSync('public/events.json', 'utf8'));

events.forEach(event => {
  const slug = slugify(event.title, { lower: true, strict: true, remove: /[*+~.()'\"\!:@]/g });
  const expectedPath = \`public/events/\${slug}/index.html\`;
  
  if (require('fs').existsSync(expectedPath)) {
    console.log('✅ Event page exists:', slug);
  } else {
    console.log('❌ Event page missing:', expectedPath);
    process.exit(1);
  }
});
console.log('✅ All event page URLs are correctly structured');
"

echo ""
echo "🎉 All QA tests passed!"
echo "✅ Events data integrity verified"
echo "✅ Build process working"
echo "✅ Event pages generated"
echo "✅ SEO structure implemented"
echo "✅ URL structure validated"
echo ""
echo "🚀 Ready for deployment!"