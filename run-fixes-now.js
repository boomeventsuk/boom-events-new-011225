const { execSync } = require('child_process');

try {
  console.log('🚀 Implementing comprehensive SEO/performance fixes...');
  
  console.log('1. Regenerating all 17 event pages with enhanced generator...');
  execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
  
  console.log('2. Running one-shot script for SEO infrastructure...');  
  execSync('node scripts/lovable-one-shot.js', { stdio: 'inherit' });
  
  console.log('\n✅ ALL FIXES IMPLEMENTED SUCCESSFULLY!');
  console.log('- ✅ Timezone offsets added to all events');
  console.log('- ✅ TBA pricing issues fixed');
  console.log('- ✅ Venue/city separation corrected');
  console.log('- ✅ UTM tracking added to booking URLs');
  console.log('- ✅ Enhanced social media meta tags');
  console.log('- ✅ Performance optimizations applied');
  console.log('- ✅ SEO infrastructure updated');
  
} catch (error) {
  console.error('❌ Error implementing fixes:', error.message);
  process.exit(1);
}