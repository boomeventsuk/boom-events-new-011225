#!/usr/bin/env node
/**
 * Proves the relative date wording shown in the event hero pill.
 *
 * Mirrors the composition used by EventPageSimple and the Silent Disco and
 * Family Silent Disco heroes: an imminent event's day takes the pill, and the
 * scarcity ladder keeps it otherwise. Sold out, cancelled and past events must
 * never carry a date.
 *
 * Time is injected, so every case is deterministic and no network or clock
 * dependency is involved. Run: node scripts/test-event-date-proximity.js
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { eventDateProximityLabel } from '../src/lib/eventDateProximity.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const events = JSON.parse(
  readFileSync(path.join(ROOT, 'public', 'events-boombastic.json'), 'utf8'),
);
const byCode = (code) => {
  const found = events.find((e) => e.eventCode === code);
  if (!found) throw new Error(`Fixture event missing from the feed: ${code}`);
  return found;
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
  scenarios += 1;
};
let scenarios = 0;
const at = (day) => new Date(`${day}T09:00:00+01:00`);

// What a visitor actually sees in the hero pill.
const pill = (event, now) => {
  if (event.isCancelled) return null;
  if (event.isSoldOut) return event.statusLabel || null;
  return eventDateProximityLabel(event.start, now) || event.statusLabel || null;
};

// ---------- 1. Real feed events ----------
const cov = byCode('190926-2PM-COV');
check(cov.start === '2026-09-19T14:00:00', `Coventry fixture start changed: ${cov.start}`);
check(pill(cov, at('2026-09-19')) === 'TODAY', 'Coventry on the day must say TODAY');
check(pill(cov, at('2026-09-18')) === 'TOMORROW', 'Coventry the day before must say TOMORROW');
check(pill(cov, at('2026-09-15')) === 'THIS SATURDAY', 'Coventry midweek must say THIS SATURDAY');
check(pill(cov, at('2026-09-13')) === 'THIS SATURDAY', 'Sunday starts the event week');
check(pill(cov, at('2026-09-12')) === 'NEXT SATURDAY', 'The Saturday before is NEXT SATURDAY');
check(pill(cov, at('2026-09-05')) === cov.statusLabel, 'Far out, the pill keeps the scarcity label');
check(pill(cov, at('2026-09-20')) === cov.statusLabel, 'Past events carry no date');

const sd = byCode('260926-SD-NPTON');
check(pill(sd, at('2026-09-20')) === 'THIS SATURDAY', 'Silent Disco event week must say THIS SATURDAY');
check(pill(sd, at('2026-09-26')) === 'TODAY', 'Silent Disco on the day must say TODAY');

const hhp = byCode('311026-HHP-NPTON');
check(pill(hhp, at('2026-09-18')) === hhp.statusLabel, 'Halloween six weeks out keeps its scarcity label');
check(pill(hhp, at('2026-10-30')) === 'TOMORROW', 'Halloween the day before must say TOMORROW');

// ---------- 2. Weekday is derived, never assumed ----------
const friday = { ...cov, start: '2026-09-18T20:00:00', statusLabel: 'Selling fast' };
check(pill(friday, at('2026-09-16')) === 'THIS FRIDAY', 'A Friday event must say THIS FRIDAY');
// Weeks are Sunday-anchored, which is what makes "the Sunday before the event
// starts its week" work for the Saturday nights this estate actually sells. The
// side effect is that a SUNDAY event reads as NEXT SUNDAY from the Wednesday
// before. Every Boombastic and 2PM event is a Saturday, so this never fires in
// practice; asserted here so the behaviour is recorded rather than discovered.
const sunday = { ...cov, start: '2026-09-20T14:00:00', statusLabel: 'Selling fast' };
check(pill(sunday, at('2026-09-16')) === 'NEXT SUNDAY', 'Sunday-anchored weeks: a Sunday event reads NEXT SUNDAY midweek');
check(pill(sunday, at('2026-09-19')) === 'TOMORROW', 'A Sunday event the day before is still TOMORROW');

// ---------- 3. States that must never show a date ----------
check(pill({ ...cov, isSoldOut: true, statusLabel: 'Sold out' }, at('2026-09-18')) === 'Sold out',
  'Sold out keeps its own label, never a date');
check(pill({ ...cov, isCancelled: true }, at('2026-09-18')) === null,
  'Cancelled shows nothing');

// ---------- 4. Bad input ----------
for (const bad of ['', null, undefined, 'not-a-date']) {
  check(eventDateProximityLabel(bad, at('2026-09-18')) === null, `Unusable start (${bad}) must give null`);
}

// ---------- 5. The naive-timestamp guard this site needs ----------
// The feed has no offset, so a visitor abroad must still get the UK day.
const farEast = new Date('2026-09-18T23:30:00+13:00'); // already the 19th locally
check(eventDateProximityLabel('2026-09-19T14:00:00', farEast) === 'TOMORROW',
  'A visitor whose own clock has rolled over still gets the UK day');

if (failures.length) {
  console.error('CHECK-EVENT-DATE-PROXIMITY FAIL');
  failures.forEach((f) => console.error('- ' + f));
  process.exit(1);
}
console.log(`CHECK-EVENT-DATE-PROXIMITY PASS: ${scenarios} scenarios`);
