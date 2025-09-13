const { execSync } = require('child_process');

try {
  console.log('Regenerating event pages with Cloudinary images...');
  execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
  console.log('✅ Event pages regenerated successfully!');
} catch (error) {
  console.error('❌ Error regenerating pages:', error.message);
}