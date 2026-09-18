#!/usr/bin/env node
/**
 * check-cancelled-event-classification.js
 *
 * Fixture-based proof for the cancelled-event detection added to
 * scripts/sync-eventbrite-prices.js. Exercises the exported pure
 * classification functions directly against fake Eventbrite responses,
 * never the real API. Mirrors the pass/fail convention of
 * check-2pm-location-contracts.js (collect failures, exit 1 on any).
 *
 * Run: node scripts/check-cancelled-event-classification.js
 */
import {
  isCancelledStatus,
  classifyCancellation,
  applyCancellationFields,
  extractPriceData,
} from './sync-eventbrite-prices.js';

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

// ------------------------------------------------------------------
// Fixture: a synthetic entry whose ticket classes are ALL unavailable
// (the exact shape that, before this fix, fell through to statusLabel
// "Coming soon" regardless of whether the event was cancelled).
// ------------------------------------------------------------------
const FAKE_UNAVAILABLE_TICKET_CLASSES = [
  { category: 'admission', free: false, on_sale_status: 'UNAVAILABLE', cost: { value: 1500, major_value: '15.00', currency: 'GBP', display: '£15.00' }, quantity_total: 100, quantity_sold: 0, display_name: 'General Admission' },
];

// Sanity check: reproduces the original defect in isolation. With no
// event-status check at all, an all-unavailable ticket_classes response
// is indistinguishable from "not on sale yet" and extractPriceData falls
// through to "Coming soon". This is why ticket_classes/ alone can never
// detect a cancellation; the fix adds a separate event-status fetch.
{
  const priceData = extractPriceData(FAKE_UNAVAILABLE_TICKET_CLASSES, '2026-10-03T14:00:00', 'Some Venue, Sample City');
  check(priceData !== null, 'sanity: expected extractPriceData to return a result for the all-unavailable fixture');
  check(priceData && priceData.public.statusLabel === 'Coming soon', `sanity: expected ticket_classes-only logic to mislabel a cancelled event as "Coming soon", got "${priceData && priceData.public.statusLabel}"`);
}

// ------------------------------------------------------------------
// 1. Fresh cancellation: Eventbrite event-status fetch succeeds and
//    reports status "canceled" (American spelling, as the API sends it).
// ------------------------------------------------------------------
{
  const event = {
    eventCode: 'TEST-CANCELLED-SAMPLE',
    eventbriteId: '9999999999999',
    title: 'THE 2PM CLUB Sample City',
    statusLabel: 'Coming soon',
    availability: 'https://schema.org/PreOrder',
  };
  const statusFetchResult = { ok: true, status: 'canceled' };
  const classification = classifyCancellation(event, statusFetchResult);

  check(classification.isCancelled === true, '1: expected isCancelled true for eventbrite status "canceled"');
  check(classification.reason.includes('eventbrite-status:canceled'), `1: expected reason to reference the eventbrite status, got "${classification.reason}"`);

  const applied = applyCancellationFields(event, classification);
  check(applied === true, '1: applyCancellationFields should report it applied the cancellation');
  check(event.isCancelled === true, '1: event.isCancelled should be true');
  check(event.statusLabel === 'Cancelled', `1: event.statusLabel should be "Cancelled", got "${event.statusLabel}"`);
  check(event.availability === 'https://schema.org/Discontinued', `1: event.availability should be schema.org/Discontinued, got "${event.availability}"`);
}

// ------------------------------------------------------------------
// 1b. Same, but Eventbrite reports "deleted" instead of "canceled".
// ------------------------------------------------------------------
{
  const event = { eventCode: 'DEL-EVENT', eventbriteId: '999', title: 'Deleted event' };
  const classification = classifyCancellation(event, { ok: true, status: 'deleted' });
  check(classification.isCancelled === true, '1b: expected isCancelled true for eventbrite status "deleted"');
  check(isCancelledStatus('deleted') === true, '1b: isCancelledStatus("deleted") should be true');
  check(isCancelledStatus('live') === false, '1b: isCancelledStatus("live") should be false');
}

// ------------------------------------------------------------------
// 2. Sticky: an entry already marked isCancelled:true must stay
//    cancelled even if a later fetch reports a non-cancelled status.
// ------------------------------------------------------------------
{
  const event = {
    eventCode: 'TEST-CANCELLED-SAMPLE',
    eventbriteId: '9999999999999',
    isCancelled: true,
    statusLabel: 'Cancelled',
    availability: 'https://schema.org/Discontinued',
  };
  const classification = classifyCancellation(event, { ok: true, status: 'live' });
  check(classification.isCancelled === true, '2: sticky cancellation must not flip back when eventbrite reports "live"');
  check(classification.reason.includes('sticky'), `2: expected sticky reason, got "${classification.reason}"`);
}

// ------------------------------------------------------------------
// 3. Fetch failure on an event that was NOT previously cancelled: must
//    never mark it cancelled purely because the status fetch failed, and
//    must leave existing fields untouched.
// ------------------------------------------------------------------
{
  const event = {
    eventCode: '121226-2PM-NPTON',
    eventbriteId: '1234567890',
    statusLabel: 'Selling fast',
    availability: 'https://schema.org/InStock',
    isSoldOut: false,
  };
  const before = JSON.stringify(event);
  const classification = classifyCancellation(event, { ok: false, error: new Error('network timeout') });
  check(classification.isCancelled === false, '3: a fetch failure must never cancel an event that was not already cancelled');

  const applied = applyCancellationFields(event, classification);
  check(applied === false, '3: applyCancellationFields must not modify the entry when classification says not cancelled');
  check(JSON.stringify(event) === before, '3: event fields must be byte-for-byte untouched after a fetch failure');
}

// ------------------------------------------------------------------
// 4. Fetch failure (transient hiccup) on an event that WAS already
//    cancelled: must stay cancelled, not silently un-cancel.
// ------------------------------------------------------------------
{
  const event = {
    eventCode: 'TEST-CANCELLED-SAMPLE',
    eventbriteId: '9999999999999',
    isCancelled: true,
    statusLabel: 'Cancelled',
    availability: 'https://schema.org/Discontinued',
  };
  const before = JSON.stringify(event);
  const classification = classifyCancellation(event, { ok: false, error: new Error('HTTP 500') });
  check(classification.isCancelled === true, '4: a transient fetch failure must never un-cancel an already-cancelled event');

  const applied = applyCancellationFields(event, classification);
  check(applied === true, '4: applyCancellationFields should reassert the cancelled fields');
  check(JSON.stringify(event) === before, '4: reasserting cancellation on an already-cancelled entry must be a no-op on the JSON');
}

// ------------------------------------------------------------------
// 5. Non-cancelled, healthy fetch: nothing should change.
// ------------------------------------------------------------------
{
  const event = { eventCode: 'ABC', eventbriteId: '42', isCancelled: undefined };
  const classification = classifyCancellation(event, { ok: true, status: 'live' });
  check(classification.isCancelled === false, '5: a live event must classify as not cancelled');
  check(applyCancellationFields(event, classification) === false, '5: applyCancellationFields must be a no-op for a live event');
}

if (failures.length) {
  console.error(`CHECK-CANCELLED-EVENT-CLASSIFICATION FAIL`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`CHECK-CANCELLED-EVENT-CLASSIFICATION PASS: 5 scenarios (fresh cancellation, deleted status, sticky, fetch-failure-not-cancelled, fetch-failure-sticky, live) verified with fake Eventbrite responses only, no network calls.`);
