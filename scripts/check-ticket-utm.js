#!/usr/bin/env node
/**
 * check-ticket-utm.js: proves /tickets/<code>/ keeps utm_* tags (F12).
 * Reads the built dist/_redirects and calls the ticket function locally.
 * No network. Run after the build: node scripts/check-ticket-utm.js
 */
import { readFileSync } from 'fs';
import { handler, ticketLocation } from '../netlify/functions/tickets/tickets.mjs';
import TICKETS from '../netlify/functions/tickets/ticket-map.mjs';

const failures = [];
const check = (c, m) => { if (!c) failures.push(m); };
const rules = readFileSync(new URL('../dist/_redirects', import.meta.url), 'utf8').split('\n');
const codes = Object.keys(TICKETS);
check(codes.length > 0, 'ticket map is empty');
for (const code of codes) {
  const rule = rules.find(r => r.startsWith(`/tickets/${code}/ `));
  check(rule === `/tickets/${code}/ /.netlify/functions/tickets/${code} 200!`, `${code}: _redirects rule missing or wrong: ${rule}`);
}
check(!rules.some(r => /^\/tickets\/\S+ https:\/\/www\.eventbrite/.test(r)), 'a static Eventbrite ticket redirect still drops utm tags');
const code = codes[0];
for (const path of [`/tickets/${code}/`, `/.netlify/functions/tickets/${code}`]) {
  const res = await handler({ path, queryStringParameters: { utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'xmas', fbclid: 'x' } });
  const url = new URL(res.headers.location);
  check(res.statusCode === 302, `${path}: expected 302`);
  check(url.origin + url.pathname === `https://www.eventbrite.co.uk/e/${TICKETS[code]}`, `${path}: wrong Eventbrite event ${url}`);
  check(url.searchParams.get('aff') === 'BoomWeb', `${path}: aff=BoomWeb lost`);
  check(url.searchParams.get('utm_source') === 'meta' && url.searchParams.get('utm_medium') === 'paid' && url.searchParams.get('utm_campaign') === 'xmas', `${path}: utm tags lost`);
  check(!url.searchParams.has('fbclid'), `${path}: non-utm parameter passed through`);
}
check(ticketLocation('/tickets/unknown/', {}) === 'https://www.boomevents.co.uk/whats-on/', 'unknown code should fall back to What\'s on');
check(new URL(ticketLocation(`/tickets/${code}/`, {})).search === '?aff=BoomWeb', 'no-utm request should carry only aff');
if (failures.length) { console.error('CHECK-TICKET-UTM FAIL'); failures.forEach(f => console.error(`- ${f}`)); process.exit(1); }
console.log(`CHECK-TICKET-UTM PASS: ${codes.length} ticket rules, utm_* preserved with aff=BoomWeb`);
