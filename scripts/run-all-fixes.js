/* Run all SEO/performance fixes */
const { execSync } = require('child_process');

try {
  console.log('1. Updating package.json scripts...');
  execSync('node scripts/update-package-scripts.js', { stdio: 'inherit' });
  
  console.log('2. Running one-shot script...');
  execSync('node scripts/lovable-one-shot.js', { stdio: 'inherit' });
  
  console.log('3. Regenerating event pages...');
  execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
  
  console.log('\n✅ All SEO/performance fixes applied successfully!');
  console.log('- Package.json updated with build pipeline');
  console.log('- Event pages regenerated with timezone fixes');
  console.log('- Performance optimizations added to index.html');
  console.log('- robots.txt, sitemap.xml, and FAQ generated');
  
} catch (error) {
  console.error('❌ Error running fixes:', error.message);
}