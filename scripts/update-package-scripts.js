/* Update package.json with missing build pipeline scripts */
const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update scripts
pkg.scripts = {
  ...pkg.scripts,
  "dev": "vite",
  "prebuild": "node scripts/generate-event-pages.cjs",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  "postinstall": "node scripts/generate-event-pages.cjs || true",
  "generate:events": "node scripts/generate-event-pages.cjs"
};

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('Updated package.json scripts');