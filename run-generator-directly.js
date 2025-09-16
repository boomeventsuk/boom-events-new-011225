const { execSync } = require('child_process');

console.log('🚀 Running event page generator...');
try {
  execSync('node scripts/generate-event-pages.js', { stdio: 'inherit' });
  console.log('✅ Generator completed successfully!');
  
  console.log('🧪 Running smoke tests...');
  execSync('node run-smoke-test.js', { stdio: 'inherit' });
  console.log('🎉 All artifacts generated and verified!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}