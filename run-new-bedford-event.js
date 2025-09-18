const { execSync } = require('child_process');

console.log('🚀 Updating Bedford event URLs...');

try {
  console.log('1. Regenerating event pages with updated URLs...');
  execSync('node scripts/generate-complete-event-pages.js', { stdio: 'inherit' });
  
  console.log('2. Updating location pages...');
  execSync('node scripts/generate-missing-location-pages.js', { stdio: 'inherit' });
  
  console.log('3. Updating sitemap...');
  execSync('node scripts/update-sitemap-events.js', { stdio: 'inherit' });
  
  console.log('\n✅ Bedford event URLs successfully updated!');
  console.log('📄 Check public/events/the-2pm-club-bedford-80s-90s-00s-daytime-disco/ for updated files');
  
} catch (error) {
  console.error('❌ Error updating Bedford event:', error.message);
  process.exit(1);
}