const { execSync } = require('child_process');

try {
  console.log('🗑️ Updating site after event removal...');
  
  // Regenerate event pages
  console.log('📄 Regenerating event pages...');
  execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
  
  // Update sitemap and other SEO assets
  console.log('🗺️ Updating sitemap and SEO assets...');
  execSync('node scripts/lovable-one-shot.js', { stdio: 'inherit' });
  
  console.log('✅ Site updated successfully after event removal!');
} catch (error) {
  console.error('❌ Error updating site:', error.message);
  process.exit(1);
}