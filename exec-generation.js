// Direct execution of generation script
const fs = require('fs');
const path = require('path');

// Import and run the generation function
const { generateAllEventPages } = require('./scripts/generate-all-event-pages.js');

console.log('Starting event page generation...');
generateAllEventPages();
console.log('Event page generation completed!');