// scripts/validate-event.js
const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/validate-event.js <slug>'); process.exit(2); }

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public', 'events', slug);

if (!fs.existsSync(dir)) { console.error('Missing dir', dir); process.exit(3); }

const htmlFile = path.join(dir, 'index.html');
const jsonFile = path.join(dir, 'index.json');

if (!fs.existsSync(htmlFile)) { console.error('Missing html', htmlFile); process.exit(4); }
if (!fs.existsSync(jsonFile)) { console.error('Missing json', jsonFile); process.exit(5); }

const html = fs.readFileSync(htmlFile, 'utf8');
if (!/lang="en-GB"/.test(html)) { console.error('lang not en-GB in', htmlFile); process.exit(6); }

try {
  const json = JSON.parse(fs.readFileSync(jsonFile,'utf8'));
  if (!json.title || !json.start) { console.error('json missing title/start'); process.exit(7); }
} catch (e) {
  console.error('invalid json', e.message); process.exit(8);
}

console.log('OK', slug);
process.exit(0);