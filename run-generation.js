const { execSync } = require('child_process');

try {
  console.log('Running event page generation...');
  execSync('node scripts/generate-all-event-pages.js', { stdio: 'inherit' });
  console.log('Generation completed successfully!');
} catch (error) {
  console.error('Generation failed:', error.message);
  process.exit(1);
}