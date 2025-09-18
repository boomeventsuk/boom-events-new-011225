// run-pass2.js
// Execute PASS 2 optimization

const { execSync } = require('child_process');

console.log('🚀 Starting PASS 2 AEO/SEO/AIO/GEO optimization...\n');

try {
  execSync('node scripts/pass2-complete-optimization.js', { stdio: 'inherit' });
  console.log('\n✅ PASS 2 optimization completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ PASS 2 optimization failed:', error.message);
  process.exit(1);
}