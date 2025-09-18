// scripts/run-complete-optimization.js
// Master script to run complete AEO/SEO optimization

const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
process.chdir(root);

console.log('🚀 Starting complete AEO/SEO/AIO/GEO optimization...\n');

const steps = [
  {
    name: 'Generate Event Pages',
    script: 'node scripts/generate-complete-event-pages.js',
    description: 'Creating all event HTML/JSON files with proper schema'
  },
  {
    name: 'Generate Location Pages', 
    script: 'node scripts/generate-missing-location-pages.js',
    description: 'Creating missing city landing pages'
  },
  {
    name: 'Add Homepage Schema',
    script: 'node scripts/add-homepage-schema.js', 
    description: 'Adding LocalBusiness and FAQ schema to homepage'
  }
];

let success = 0;
let failed = 0;

for (const step of steps) {
  console.log(`📋 ${step.name}: ${step.description}`);
  try {
    execSync(step.script, { stdio: 'inherit' });
    console.log(`✅ ${step.name} completed\n`);
    success++;
  } catch (error) {
    console.error(`❌ ${step.name} failed:`, error.message);
    failed++;
  }
}

console.log('📊 OPTIMIZATION SUMMARY');
console.log(`✅ Successful steps: ${success}`);
console.log(`❌ Failed steps: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 Complete AEO/SEO optimization finished successfully!');
  console.log('📄 Check automation/ folder for detailed reports');
} else {
  console.log('\n⚠️ Some optimization steps failed. Check logs above for details.');
  process.exit(1);
}

process.exit(0);