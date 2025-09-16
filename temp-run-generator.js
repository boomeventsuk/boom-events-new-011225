const { execSync } = require('child_process');

console.log('🚀 Running event page generator...');
try {
  execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
  console.log('✅ Generator completed successfully!');
} catch (error) {
  console.error('❌ Generator failed:', error.message);
  process.exit(1);
}