const fs = require('fs');

// Read existing events.json
const eventsData = JSON.parse(fs.readFileSync('public/events.json', 'utf8'));

// Read event copy
const eventCopy = JSON.parse(fs.readFileSync('content/event-copy.json', 'utf8'));

// Add missing Silent Disco MK event (ID 2)
const missingEvent = {
  "id": 2,
  "title": "SILENT DISCO MILTON KEYNES: POP VS INDIE VS DANCE",
  "location": "MK11 Music Venue, Milton Keynes",
  "start": "2025-09-19T20:30:00",
  "end": "2025-09-20T00:30:00",
  "bookUrl": "https://www.eventbrite.co.uk/e/greatest-hits-silent-disco-milton-keynes-tickets-1345076533120?WEBLINK=",
  "infoUrl": "https://www.facebook.com/events/1747332309299707",
  "image": "/lovable-uploads/3151f4c2-caa9-4718-9327-33c7a7fc882f.png",
  "description": "Milton Keynes, the headphones are on, the lights are glowing, and the battle is about to begin. Three DJs. Three channels. One dance floor. Will you belt the pop anthems, jump with the indie crowd, or rave to the dance bangers? The beauty is you can do it all — flip channels whenever the mood takes you and laugh as your mates sing wildly to something totally different. It's four hours of no-compromise fun, glowing headphone selfies, and that Monday smugness knowing you just nailed the weekend."
};

// Find the right position to insert (after ID 1, before ID 3)
const insertIndex = eventsData.findIndex(event => event.id === 3);
if (insertIndex !== -1) {
  eventsData.splice(insertIndex, 0, missingEvent);
}

// Update descriptions with event copy
eventsData.forEach(event => {
  if (eventCopy[event.id.toString()]) {
    event.description = eventCopy[event.id.toString()];
  }
});

// Sort events by ID to ensure proper order
eventsData.sort((a, b) => a.id - b.id);

// Write updated events.json
fs.writeFileSync('public/events.json', JSON.stringify(eventsData, null, 2));

console.log('✅ Updated events.json with event copy and added missing Silent Disco MK event');
console.log(`📊 Total events: ${eventsData.length}`);