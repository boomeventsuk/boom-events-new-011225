const fs = require('fs');
const path = require('path');

// Import the generator script content and execute it
import('./scripts/generate-event-pages.js')
  .then(() => {
    console.log('✅ Generator completed successfully!');
    
    // Run verification
    const filesToCheck = [
      'public/venues.json',
      'public/sitemap.xml', 
      'public/events/the-2pm-club-coventry-80s-90s-00s-daytime-disco/index.json',
      'public/locations/milton-keynes/index.html'
    ];
    
    console.log('\n🔍 Verification Results:');
    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    });
    
    // Check sample HTML for correct lang
    try {
      const sampleHTML = fs.readFileSync('public/events/the-2pm-club-coventry-80s-90s-00s-daytime-disco/index.html', 'utf8');
      if (sampleHTML.includes('<html lang="en-GB">')) {
        console.log('✅ HTML lang="en-GB" correct');
      } else {
        console.log('❌ HTML lang needs fixing');
      }
    } catch (e) {
      console.log('❌ Could not check HTML lang');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });