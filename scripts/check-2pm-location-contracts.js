#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const events = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'events-boombastic.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const current = events.filter((event) => /-2PM-/i.test(event.eventCode || '') && event.start?.slice(0, 10) >= today);
const cities = ['northampton', 'bedford', 'milton-keynes', 'coventry', 'luton', 'leicester'];
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const redirectText = fs.readFileSync(path.join(ROOT, 'dist', '_redirects'), 'utf8');

for (const city of cities) {
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'locations', city, 'index.html'), 'utf8');
  check((html.match(/<main(?:\s|>)/g) || []).length === 1, `${city}: expected one main landmark`);
  check(!/13:00|1pm to 5pm/.test(html), `${city}: stale non-UK 2PM time remains`);
  check(!/M17 5H9\.5/.test(html), `${city}: dollar-style icon remains`);
}

for (const event of current) {
  const code = event.eventCode.toLowerCase();
  const targetCode = event.eventCode.toUpperCase() === '250726-2PM-NPTON' ? '031026-2pm-npton' : code;
  const target = `https://www.the2pmclub.co.uk/events/${targetCode}/`;
  const citySlug = event.city.toLowerCase().replace(/\s+/g, '-');
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'locations', citySlug, 'index.html'), 'utf8');
  check(html.includes(target), `${event.eventCode}: location card or schema lacks canonical 2PM URL`);
  check(html.includes('+ booking fee'), `${event.eventCode}: booking-fee wording missing`);
  check(redirectText.includes(`/event/${code}`) && redirectText.includes(target), `${event.eventCode}: canonical redirect missing`);
}

const sitemap = fs.readFileSync(path.join(ROOT, 'dist', 'sitemap.xml'), 'utf8');
check(!/<loc>[^<]*\/event\/[^<]*2pm/i.test(sitemap), 'Boom sitemap still contains a 2PM event leaf');
check(redirectText.indexOf('# 2PM canonical ownership: generated start') < redirectText.indexOf('# SPA routes - explicit React Router paths only'), '2PM redirects appear after SPA fallback');

if (failures.length) {
  console.error(`CHECK-BOOM-2PM-LOCATIONS FAIL (${process.env.TZ || 'default'})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`CHECK-BOOM-2PM-LOCATIONS PASS (${process.env.TZ || 'default'}): ${current.length} live 2PM records, 6 locations`);
