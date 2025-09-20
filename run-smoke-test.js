const fs = require('fs');
const path = require('path');

console.log('🔍 Running smoke tests for SEO/AEO/AIO artifacts...');

let passed = 0;
let failed = 0;

function test(name, condition, errorMsg) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}: ${errorMsg}`);
    failed++;
  }
}

// Test 1: Check sitemap includes required URLs
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
test('Sitemap includes /for-ai/', sitemap.includes('/for-ai/'), 'Missing /for-ai/ entry');
test('Sitemap includes /venues.json', sitemap.includes('/venues.json'), 'Missing /venues.json entry');
test('Sitemap includes location pages', sitemap.includes('/locations/'), 'Missing location page entries');

// Test 2: Check venues.json exists and is valid JSON
try {
  const venues = JSON.parse(fs.readFileSync('public/venues.json', 'utf8'));
  test('venues.json exists and valid', typeof venues === 'object', 'Invalid JSON structure');
  test('venues.json has cities', Object.keys(venues).length > 0, 'No cities found');
} catch (e) {
  test('venues.json exists and valid', false, e.message);
}

// Test 3: Check sample event JSON exists and is valid
const sampleEventPath = 'public/events/footloose-80s-day-party-bedford/index.json';
try {
  const eventJson = JSON.parse(fs.readFileSync(sampleEventPath, 'utf8'));
  test('Sample event JSON exists', typeof eventJson === 'object', 'Invalid JSON structure');
  test('Event JSON has price', typeof eventJson.price === 'number', 'Missing numeric price');
} catch (e) {
  test('Sample event JSON exists', false, `File missing or invalid: ${e.message}`);
}

// Test 4: Check sample location page exists  
const locationPath = 'public/locations/milton-keynes/index.html';
try {
  const locationHtml = fs.readFileSync(locationPath, 'utf8');
  test('Location page exists', locationHtml.includes('<html lang="en-GB">'), 'Missing proper HTML structure');
} catch (e) {
  test('Location page exists', false, `File missing: ${e.message}`);
}

// Test 5: Check required static files
const requiredFiles = [
  'public/site.webmanifest',
  'public/apple-touch-icon.png', 
  'public/for-ai/index.html'
];

requiredFiles.forEach(file => {
  test(`${file} exists`, fs.existsSync(file), 'File not found');
});

console.log(`\n🎉 Tests completed: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All smoke tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}