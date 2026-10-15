#!/usr/bin/env node
/**
 * check-feed-upcoming-only.js
 *
 * Fixture proof that the Eventbrite sync can never write an ended event back
 * into the public feed. Exercises splitPastEvents directly; never calls the
 * Eventbrite API. Also checks the checked-in feed holds no ended record.
 *
 * Run: node scripts/check-feed-upcoming-only.js
 */
import { readFileSync } from 'fs';
import { splitPastEvents, londonToday } from './sync-eventbrite-prices.js';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const fixture = [
  { eventCode: 'OLD-1', start: '2026-09-26T20:30:00', statusLabel: 'Selling fast', availability: 'https://schema.org/LimitedAvailability', price: 10, venue: 'X', city: 'Northampton' },
  { eventCode: 'TODAY', start: '2026-10-13T20:00:00', statusLabel: 'Final tickets' },
  { eventCode: 'NEW-1', start: '2026-12-04T20:30:00', statusLabel: 'Selling fast' },
];
const result = splitPastEvents(fixture, [{ eventCode: 'OLDER', start: '2026-01-01T14:00:00' }], '2026-10-13');
check(result.upcoming.map(e => e.eventCode).join(',') === 'TODAY,NEW-1', 'upcoming should keep today and future dates only');
check(result.history.map(e => e.eventCode).join(',') === 'OLDER,OLD-1', 'history should gain the ended record, in date order');
const archived = result.history.find(e => e.eventCode === 'OLD-1');
check(archived && !('statusLabel' in archived) && !('availability' in archived) && !('price' in archived), 'archived record must not carry urgency, availability or price');
const again = splitPastEvents(fixture, result.history, '2026-10-13');
check(again.history.length === 2, 'running twice must not duplicate history');
check(/^\d{4}-\d{2}-\d{2}$/.test(londonToday(new Date('2026-10-25T00:30:00Z'))), 'londonToday returns an ISO date');
check(londonToday(new Date('2026-06-30T23:30:00Z')) === '2026-07-01', 'londonToday uses the UK calendar (BST)');

const feed = JSON.parse(readFileSync(new URL('../public/events-boombastic.json', import.meta.url)));
const today = londonToday();
const stale = feed.filter(e => String(e.start).slice(0, 10) < today).map(e => e.eventCode);
check(stale.length === 0, `checked-in feed still holds ended events: ${stale.join(', ')}`);

if (failures.length) {
  console.error('CHECK-FEED-UPCOMING-ONLY FAIL');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}
console.log(`CHECK-FEED-UPCOMING-ONLY PASS: ${feed.length} upcoming records, fixture split verified`);
