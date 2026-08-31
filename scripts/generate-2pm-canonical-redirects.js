#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const feed = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'events-boombastic.json'), 'utf8'));
const redirectsPath = path.join(ROOT, 'public', '_redirects');
const START = '# 2PM canonical ownership: generated start';
const END = '# 2PM canonical ownership: generated end';
const canonicalCode = (code) => code.toUpperCase() === '250726-2PM-NPTON' ? '031026-2PM-NPTON' : code;

const rules = feed
  .filter((event) => /-2PM-/i.test(event.eventCode || ''))
  .flatMap((event) => {
    const source = event.eventCode.toLowerCase();
    const target = `https://www.the2pmclub.co.uk/events/${canonicalCode(event.eventCode).toLowerCase()}/`;
    return [
      `/event/${source}          ${target}  301!`,
      `/event/${source}/*        ${target}  301!`,
    ];
  });

let redirects = fs.readFileSync(redirectsPath, 'utf8');
const block = `${START}\n${rules.join('\n')}\n${END}`;
const existing = new RegExp(`${START}[\\s\\S]*?${END}`);
if (existing.test(redirects)) redirects = redirects.replace(existing, block);
else {
  const anchor = '# SPA routes - explicit React Router paths only';
  if (!redirects.includes(anchor)) throw new Error(`Missing redirects anchor: ${anchor}`);
  redirects = redirects.replace(anchor, `${block}\n\n${anchor}`);
}
fs.writeFileSync(redirectsPath, redirects);
console.log(`generate-2pm-canonical-redirects: ${rules.length / 2} event codes`);
