const { execSync } = require('child_process');

try {
  console.log('Running PASS 1 Event Generation...');
  execSync('node scripts/pass1-event-generation.js', { stdio: 'inherit' });
  
  console.log('\nUpdating sitemap...');
  execSync('node scripts/update-sitemap-events.js', { stdio: 'inherit' });
  
  console.log('\nPASS 1 Complete!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}