// scripts/generate-and-validate-all.js
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const eventsPath = path.join(root, 'public', 'events.json');
if (!fs.existsSync(eventsPath)) { console.error('No events.json at', eventsPath); process.exit(2); }
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

const fails = [];

function run(cmd) {
  try {
    cp.execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (e) {
    return false;
  }
}

for (const ev of events) {
  const slug = ev.slug || ev.id || (() => {fails.push({ev,err:'no-slug'}); return null;})();
  if (!slug) continue;
  console.log('----', slug, '----');

  // try main generator if exists
  let ok = false;
  if (fs.existsSync(path.join(root,'scripts','generate-event-by-slug.js'))) {
    ok = run(`node scripts/generate-event-by-slug.js ${slug}`);
  } else {
    ok = run(`node scripts/generate-single-event.js ${slug}`);
  }

  // validate
  try {
    run(`node scripts/validate-event.js ${slug}`);
  } catch (e) {
    fails.push({slug, reason: e.message});
  }
}

console.log('Done. Fails:', fails.length);
if (fails.length) {
  console.error('Failed items:', JSON.stringify(fails, null, 2));
  process.exit(10);
}
console.log('All events generated and validated.');