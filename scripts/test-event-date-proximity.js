#!/usr/bin/env node
/**
 * Proves the relative date wording shown in the event hero pill.
 *
 * Mirrors the composition used by EventPageSimple and the Silent Disco and
 * Family Silent Disco heroes: an imminent event's day takes the pill, and the
 * scarcity ladder keeps it otherwise. Sold out, cancelled and past events must
 * never carry a date.
 *
 * Section 6 proves the precedence JD asked for on 18th September 2026: genuine
 * scarcity outranks the day, and a ticket TIER name does not. Section 7 pins
 * the plain-JS port shipped inside the static location pages to the TypeScript
 * original, so the two implementations of the same rule cannot drift.
 *
 * Time is injected, so every case is deterministic and no network or clock
 * dependency is involved. Run: node scripts/test-event-date-proximity.js
 */
import { readFileSync } from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import {
  eventDateProximityLabel,
  eventUrgencyLabel,
  isGenuineScarcityLabel,
} from '../src/lib/eventDateProximity.ts';

const require = createRequire(import.meta.url);
const { EVENT_URGENCY_SCRIPT } = require('./generate-location-pages.cjs');

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

// What a visitor actually sees in the hero pill: the surface's own sold-out and
// cancelled handling first, then the one shared precedence rule.
const pill = (event, now) => {
  if (event.isCancelled) return null;
  if (event.isSoldOut) return event.statusLabel || null;
  return eventUrgencyLabel(event.start, event.statusLabel, now).text;
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

// ---------- 6. Genuine scarcity outranks the day ----------
// JD 18th September 2026: the date leads, unless the tickets themselves are the
// story. The list of labels that count is closed and tiny.
const twoDaysOut = at('2026-09-17'); // the Coventry event is Saturday 19th
for (const scarce of ['Final tickets', 'Last few tickets', 'Join waiting list']) {
  check(pill({ ...cov, statusLabel: scarce }, twoDaysOut) === scarce,
    `Genuine scarcity "${scarce}" must beat THIS SATURDAY`);
  check(eventUrgencyLabel(cov.start, scarce, twoDaysOut).isDate === false,
    `Genuine scarcity "${scarce}" must not borrow the date's glow`);
  check(isGenuineScarcityLabel(scarce.toUpperCase()),
    `Scarcity matching must be case-insensitive: ${scarce}`);
}
// "Final release" is a ticket TIER name. The Silent Disco carries it with about
// 98 tickets left, so it is momentum copy and the day must still win.
for (const notScarce of [
  'Final release',
  'Selling fast',
  'Over two-thirds sold',
  'General release now open',
  'Just announced',
]) {
  check(pill({ ...cov, statusLabel: notScarce }, twoDaysOut) === 'THIS SATURDAY',
    `"${notScarce}" is not genuine scarcity, the date must win`);
  check(isGenuineScarcityLabel(notScarce) === false,
    `"${notScarce}" must not count as genuine scarcity`);
}
// Far out, genuine scarcity is simply the label it always was.
check(pill({ ...hhp, statusLabel: 'Final tickets' }, at('2026-09-18')) === 'Final tickets',
  'Genuine scarcity six weeks out is still just the label');
// Sold out is untouched by the new rule, including when it is also imminent.
check(pill({ ...cov, isSoldOut: true, statusLabel: 'Join waiting list' }, twoDaysOut) === 'Join waiting list',
  'Sold out keeps its own label whatever the precedence says');
check(pill({ ...cov, isSoldOut: true, statusLabel: 'Sold out' }, at('2026-09-19')) === 'Sold out',
  'Sold out on the day still shows no date');
// No label at all: the date still leads, and nothing is invented when it is far.
check(eventUrgencyLabel(cov.start, undefined, twoDaysOut).text === 'THIS SATURDAY',
  'An event with no scarcity label still gets its date');
check(eventUrgencyLabel(cov.start, undefined, at('2026-09-05')).text === null,
  'No label and no date means nothing to show');

// ---------- 7. The static location pages ship the same rule ----------
// The location pages are standalone HTML with no bundler, so the date half of
// the precedence is a hand-written plain-JS port living in
// scripts/generate-location-pages.cjs. This runs THAT EXACT STRING, the one
// that ends up in the deployed file, against the TypeScript original over a
// matrix of dates. If anyone edits one and not the other, this fails.
const runInlineScript = (cards, now) => {
  const elements = cards.map((card) => ({
    attributes: {
      'data-event-start': card.start,
      'data-scarcity-label': card.statusLabel,
    },
    textContent: card.statusLabel,
    classes: [],
    getAttribute(name) {
      const value = this.attributes[name];
      return value === undefined ? null : value;
    },
    classList: {
      add(name) {
        if (!this.owner.classes.includes(name)) this.owner.classes.push(name);
      },
    },
  }));
  elements.forEach((el) => { el.classList.owner = el; });
  const context = {
    document: {
      querySelectorAll: (selector) =>
        selector === '.fomo-badge[data-event-start]' ? elements : [],
    },
    // Freeze "now" without touching any other Date behaviour.
    Date: new Proxy(Date, {
      construct: (target, args) => (args.length ? new target(...args) : new Date(now.getTime())),
    }),
  };
  vm.runInNewContext(EVENT_URGENCY_SCRIPT, context);
  return elements.map((el) => ({ text: el.textContent, isDate: el.classes.includes('is-date-urgent') }));
};

// One card per label, swept across every day from five weeks before the
// Coventry event to a week after it, in both implementations.
const PARITY_LABELS = [
  'Selling fast', 'Final release', 'Just announced', 'General release now open',
  'Over two-thirds sold', 'Final tickets', 'Last few tickets', 'Join waiting list',
];
const PARITY_STARTS = [
  '2026-09-19T14:00:00', // Saturday
  '2026-09-18T20:00:00', // Friday
  '2026-09-20T14:00:00', // Sunday
  '2026-10-31T20:00:00', // six weeks out
  'not-a-date',          // unparseable
];
let parityCases = 0;
const parityMismatches = [];
for (let offset = -35; offset <= 7; offset += 1) {
  const now = new Date(Date.UTC(2026, 8, 19, 8, 0, 0) + offset * 86400000);
  const cards = [];
  for (const start of PARITY_STARTS) {
    for (const statusLabel of PARITY_LABELS) cards.push({ start, statusLabel });
  }
  const browser = runInlineScript(cards, now);
  cards.forEach((card, i) => {
    const expected = eventUrgencyLabel(card.start, card.statusLabel, now);
    parityCases += 1;
    if (browser[i].text !== expected.text || browser[i].isDate !== expected.isDate) {
      parityMismatches.push(
        `${now.toISOString().slice(0, 10)} ${card.start} "${card.statusLabel}": ` +
        `inline ${JSON.stringify(browser[i])} vs TypeScript ${JSON.stringify(expected)}`,
      );
    }
  });
}
check(parityMismatches.length === 0,
  `Inline location-page script drifted from src/lib/eventDateProximity.ts:\n  ${parityMismatches.slice(0, 5).join('\n  ')}`);
check(parityCases === 43 * PARITY_STARTS.length * PARITY_LABELS.length,
  `Parity sweep did not cover the matrix it claims: ${parityCases}`);

// The inline script must fail silent, never blank a pill it cannot understand.
const silent = runInlineScript([
  { start: undefined, statusLabel: 'Selling fast' },
  { start: '', statusLabel: 'Selling fast' },
  { start: 'not-a-date', statusLabel: 'Selling fast' },
  { start: '2026-09-19T14:00:00', statusLabel: undefined },
], at('2026-09-18'));
check(silent[0].text === 'Selling fast' && silent[1].text === 'Selling fast' && silent[2].text === 'Selling fast',
  'An unusable start must leave the baked scarcity label alone');
check(silent[3].text === 'TOMORROW' && silent[3].isDate === true,
  'A missing scarcity label must not stop the date showing');

if (failures.length) {
  console.error('CHECK-EVENT-DATE-PROXIMITY FAIL');
  failures.forEach((f) => console.error('- ' + f));
  process.exit(1);
}
console.log(`CHECK-EVENT-DATE-PROXIMITY PASS: ${scenarios} scenarios, ${parityCases} inline-script parity cases`);
