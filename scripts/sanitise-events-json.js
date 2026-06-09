#!/usr/bin/env node
/**
 * sanitise-events-json.js
 *
 * House rule: no em dashes anywhere. Event entries are authored at
 * event-setup time and have historically carried em dashes from copy
 * drafts, which then propagate into page titles, JSON-LD and OG tags.
 *
 * This script rewrites public/events-boombastic.json with every U+2014
 * removed: titles get ": " (subtitle separator), all other strings get
 * " - ". Runs in the regenerate-locations workflow before page
 * generation, so the JSON self-heals daily and on every push.
 *
 * Run: node scripts/sanitise-events-json.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = resolve(__dirname, '../public/events-boombastic.json');

function sanitiseString(value, isTitle) {
  if (!value.includes('—')) return value;
  let out = value;
  if (isTitle) out = out.replace(/\s*—\s*/, ': '); // first em dash becomes the subtitle separator
  return out.replace(/\s*—\s*/g, ' - ');
}

function sanitiseEmDashes(node, key, counter) {
  if (typeof node === 'string') {
    const clean = sanitiseString(node, key === 'title');
    if (clean !== node) counter.count++;
    return clean;
  }
  if (Array.isArray(node)) return node.map(v => sanitiseEmDashes(v, key, counter));
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = sanitiseEmDashes(node[k], k, counter);
  }
  return node;
}

const events = JSON.parse(readFileSync(EVENTS_PATH, 'utf-8'));
const counter = { count: 0 };
sanitiseEmDashes(events, null, counter);

if (counter.count > 0) {
  writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + '\n');
  console.log(`Sanitised em dashes in ${counter.count} field(s). Wrote ${EVENTS_PATH}`);
} else {
  console.log('No em dashes found. File unchanged.');
}
