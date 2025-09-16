const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Running final generator test...');

try {
  // Run our generator
  execSync('node run-generator-final.js', { stdio: 'inherit' });
  
  console.log('\n🔍 Verification:');
  
  // Check sample files
  const checks = [
    'public/venues.json',
    'public/sitemap.xml',
    'public/events/silent-disco-milton-keynes-pop-vs-indie-vs-dance/index.json',
    'public/events/silent-disco-milton-keynes-pop-vs-indie-vs-dance/index.html',
    'public/locations/bedford/index.html',
    'public/locations/northampton/index.html',
    'public/locations/birmingham/index.html'
  ];
  
  for (const file of checks) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
      
      // Check lang attribute for HTML files  
      if (file.endsWith('.html')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('<html lang="en-GB">')) {
          console.log(`   ✅ Correct lang="en-GB"`);
        } else {
          console.log(`   ❌ Missing lang="en-GB"`);
        }
      }
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
  
  // Run smoke test
  console.log('\n🧪 Running smoke test...');
  execSync('node run-smoke-test.js', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}