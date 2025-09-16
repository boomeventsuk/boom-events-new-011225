// scripts/generate-and-validate-all.js
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname,'..');
const eventsPath = path.join(root,'public','events.json');
if (!fs.existsSync(eventsPath)) {
  console.error('Missing events.json at', eventsPath);
  process.exit(2);
}
const events = JSON.parse(fs.readFileSync(eventsPath,'utf8'));

const fails = [];

function run(cmd) {
  try {
    cp.execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (e) {
    return false;
  }
}

// process each event
for (const ev of events) {
  const slug = ev.slug || ev.id || (ev.title && ev.title.toLowerCase().replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-'));
  if (!slug) {
    fails.push({ slug: null, reason: 'no-slug' });
    continue;
  }

  console.log('----', slug, '----');

  // generate (if missing) using our single-event generator
  const eventDir = path.join(root,'public','events',String(slug));
  if (!fs.existsSync(eventDir) || !fs.existsSync(path.join(eventDir,'index.json')) || !fs.existsSync(path.join(eventDir,'index.html'))) {
    const ok = run(`node scripts/generate-single-event.js ${slug}`);
    if (!ok) {
      fails.push({ slug, reason: 'generate_failed' });
      continue;
    }
  } else {
    console.log('Exists, skipping generation:', slug);
  }

  // validate
  const okVal = run(`node scripts/validate-event.js ${slug}`);
  if (!okVal) {
    fails.push({ slug, reason: 'validation_failed' });
  }
}

console.log('Done. Fails:', fails.length);
if (fails.length) {
  console.error('Failed items:', JSON.stringify(fails, null, 2));
  process.exit(10);
}
console.log('All events generated and validated.');
process.exit(0);