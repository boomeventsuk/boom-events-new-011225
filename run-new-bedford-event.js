const { execSync } = require('child_process');

console.log('🚀 Adding new Bedford event to site...');

try {
  console.log('1. Generating event pages with complete SEO optimization...');
  execSync('node scripts/generate-complete-event-pages.js', { stdio: 'inherit' });
  
  console.log('2. Generating location pages...');
  execSync('node scripts/generate-missing-location-pages.js', { stdio: 'inherit' });
  
  console.log('3. Updating sitemap...');
  execSync('node scripts/update-sitemap-events.js', { stdio: 'inherit' });
  
  console.log('\n✅ Bedford event successfully added to site!');
  console.log('📄 Check public/events/the-2pm-club-bedford-80s-90s-00s-daytime-disco/ for new files');
  
} catch (error) {
  console.error('❌ Error adding Bedford event:', error.message);
  process.exit(1);
}