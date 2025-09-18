const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix all event HTML files to use lang="en-GB"
const eventDirs = fs.readdirSync(path.join(__dirname, '..', 'public', 'events'));

let fixed = 0;
for (const dir of eventDirs) {
  const htmlFile = path.join(__dirname, '..', 'public', 'events', dir, 'index.html');
  if (fs.existsSync(htmlFile)) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    if (content.includes('lang="en"')) {
      content = content.replace('lang="en"', 'lang="en-GB"');
      fs.writeFileSync(htmlFile, content);
      fixed++;
    }
  }
}

console.log(`Fixed ${fixed} HTML files with lang="en-GB"`);

// Run event creation script
execSync('node scripts/create-all-events.js', { stdio: 'inherit' });