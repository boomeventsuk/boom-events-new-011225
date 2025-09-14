/* Update package.json with missing build pipeline scripts */
const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update scripts
pkg.scripts = {
  ...pkg.scripts,
  "generate:events": "node scripts/generate-event-pages.js",
  "build": "npm run generate:events && vite build",
  "postinstall": "node scripts/lovable-one-shot.js"
};

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('Updated package.json scripts');