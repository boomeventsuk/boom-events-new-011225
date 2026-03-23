const fs = require('fs');

// Read existing events-boombastic.json
const eventsData = JSON.parse(fs.readFileSync('public/events-boombastic.json', 'utf8'));

// Read event copy (keyed by numeric index matching original event order)
const eventCopy = JSON.parse(fs.readFileSync('content/event-copy.json', 'utf8'));

// Update descriptions with event copy where a numeric key matches event position (1-based)
eventsData.forEach((event, index) => {
  const key = String(index + 1);
  if (eventCopy[key]) {
    event.description = eventCopy[key];
  }
});

// Write updated events-boombastic.json
fs.writeFileSync('public/events-boombastic.json', JSON.stringify(eventsData, null, 2));

console.log('Updated events-boombastic.json with event copy');
console.log(`Total events: ${eventsData.length}`);
