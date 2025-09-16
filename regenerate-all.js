const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function regenerateAll() {
  console.log('🚀 Starting full regeneration of event pages and artifacts...');
  
  try {
    // Run the main generator
    console.log('📄 Running event page generator...');
    execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
    
    // Verify key files exist
    console.log('✅ Verifying generated files...');
    
    const checkFiles = [
      'public/venues.json',
      'public/sitemap.xml',
      'public/events/silent-disco-milton-keynes-pop-vs-indie-vs-dance/index.json',
      'public/events/silent-disco-milton-keynes-pop-vs-indie-vs-dance/index.html',
      'public/locations/milton-keynes/index.html'
    ];
    
    for (const file of checkFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    }
    
    // Check HTML lang attribute
    const sampleHTML = fs.readFileSync('public/events/silent-disco-milton-keynes-pop-vs-indie-vs-dance/index.html', 'utf8');
    if (sampleHTML.includes('<html lang="en-GB">')) {
      console.log('✅ HTML lang attribute is correct (en-GB)');
    } else {
      console.log('❌ HTML lang attribute needs fixing');
    }
    
    console.log('🧪 Running smoke tests...');
    execSync('node run-smoke-test.js', { stdio: 'inherit' });
    
    console.log('🎉 Full regeneration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during regeneration:', error.message);
    process.exit(1);
  }
}

regenerateAll();