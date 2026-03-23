// Test the single event generator with a known event
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events-boombastic.json');
const rawEvents = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const events = rawEvents.map(ev => ({
  ...ev,
  id:       ev.id       || ev.eventCode,
  location: ev.location || (ev.venue && ev.city ? `${ev.venue}, ${ev.city}` : ev.city || ev.venue || ''),
  bookUrl:  ev.bookUrl  || (ev.eventbriteId ? `https://www.eventbrite.co.uk/e/${ev.eventbriteId}` : '')
}));

// Test with the first event
const testEvent = events[0];
console.log('Testing event generation for:', testEvent.title);
console.log('Event ID:', testEvent.id);

// Create a slug for testing
function slugify(text='') {
  return String(text).toLowerCase().replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-');
}

const testSlug = testEvent.slug || slugify(testEvent.title);
console.log('Generated slug:', testSlug);

// Check what files currently exist
const eventDir = path.join(root, 'public', 'events', testSlug);
console.log('\nCurrent state:');
console.log('- Event directory exists:', fs.existsSync(eventDir));
if (fs.existsSync(eventDir)) {
  console.log('- HTML file exists:', fs.existsSync(path.join(eventDir, 'index.html')));
  console.log('- JSON file exists:', fs.existsSync(path.join(eventDir, 'index.json')));
}

console.log('\nTo test generation, run:');
console.log(`node scripts/generate-single-event.js ${testSlug}`);
console.log(`node scripts/validate-event.js ${testSlug}`);