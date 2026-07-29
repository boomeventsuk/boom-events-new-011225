#!/usr/bin/env node
/**
 * sync-eventbrite-prices.js
 *
 * Pulls live ticket pricing and availability from Eventbrite API
 * and enriches events.json with structured price data.
 *
 * Run: node scripts/sync-eventbrite-prices.js
 * Requires: EVENTBRITE_TOKEN env var (or .env.local file)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EVENTS_PATH = resolve(ROOT, 'public/events-boombastic.json');
const INTERNAL_PATH = resolve(ROOT, 'scripts/.ticket-data-internal.json');

// Load token from env or .env.local
function loadToken() {
  if (process.env.EVENTBRITE_TOKEN) return process.env.EVENTBRITE_TOKEN;

  const envLocal = resolve(ROOT, '.env.local');
  if (existsSync(envLocal)) {
    const lines = readFileSync(envLocal, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^EVENTBRITE_TOKEN=(.+)$/);
      if (match) return match[1].trim();
    }
  }

  throw new Error('EVENTBRITE_TOKEN not found in environment or .env.local');
}

async function fetchTicketClasses(eventbriteId, token) {
  const url = `https://www.eventbriteapi.com/v3/events/${eventbriteId}/ticket_classes/`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    console.warn(`  WARNING: Eventbrite API returned ${res.status} for event ${eventbriteId}`);
    return null;
  }

  const data = await res.json();
  return data.ticket_classes || [];
}

// ============================================================
// Per-venue count rules (JD, 2026-06-10).
// countFrom = the singles-remaining level at which the badge may
// start showing a number. Bigger rooms earn their counts later.
// ============================================================
const VENUE_COUNT_RULES = [
  { match: /hmv empire/i, countFrom: 100 },
  { match: /picturedrome/i, countFrom: 50 },
  { match: /esquires/i, countFrom: 50 },
  { match: /mk11/i, countFrom: 50 },
];
const DEFAULT_COUNT_FROM = 100;

function venueCountFrom(location) {
  const rule = VENUE_COUNT_RULES.find(r => r.match.test(location || ''));
  return rule ? rule.countFrom : DEFAULT_COUNT_FROM;
}

// £40 not £40.00, but £12.50 keeps its pennies
function fmtPounds(value) {
  return Number.isInteger(value) ? `£${value}` : `£${value.toFixed(2)}`;
}

function launchStatusLabel(event, computedLabel, isSoldOut, now = Date.now()) {
  if (isSoldOut) return computedLabel;
  const saleStartsAt = Date.parse(event.saleStartsAt || '');
  if (!Number.isFinite(saleStartsAt)) return computedLabel;
  const launchLabelUntil = Date.parse(event.launchLabelUntil || '');
  if (now < saleStartsAt) return 'Tickets on sale Friday at 12 noon';
  if (Number.isFinite(launchLabelUntil) && now < launchLabelUntil) return 'Tickets on sale now';
  return computedLabel;
}

function extractPriceData(ticketClasses, eventDate, location) {
  if (!ticketClasses || ticketClasses.length === 0) return null;

  // Filter to admission tickets only (ignore donations, etc.)
  const admission = ticketClasses.filter(tc => tc.category === 'admission' && !tc.free);
  if (admission.length === 0) return null;

  // Find the cheapest available ticket (or cheapest overall if none available)
  const available = admission.filter(tc => tc.on_sale_status === 'AVAILABLE');
  const source = available.length > 0 ? available : admission;
  const cheapest = source.reduce((min, tc) =>
    tc.cost.value < min.cost.value ? tc : min, source[0]);

  // ============================================================
  // ATTENDEE-BASED capacity (not ticket count)
  // Group tickets (e.g. "Group of 4") represent multiple attendees.
  // A ticket named "Group of 4" with qty 25 = 100 attendee spots.
  // All percentages and thresholds use attendee counts.
  // ============================================================

  function attendeesPerTicket(tc) {
    const name = (tc.display_name || tc.name || '').toLowerCase();
    // Match "group of 4", "4 tickets", "group (4)", etc.
    const groupMatch = name.match(/(?:group|bundle|pack)\s*(?:of\s*)?(\d+)|(\d+)\s*(?:ticket|person|people)/);
    if (groupMatch) return parseInt(groupMatch[1] || groupMatch[2], 10);
    return 1;
  }

  const tiers = admission.map(tc => {
    const multiplier = attendeesPerTicket(tc);
    return {
      name: tc.display_name || tc.name,
      price: parseFloat(tc.cost.major_value),
      status: tc.on_sale_status,
      ticketCapacity: tc.quantity_total,
      ticketSold: tc.quantity_sold,
      attendeesPerTicket: multiplier,
      attendeeCapacity: (tc.quantity_total || 0) * multiplier,
      attendeeSold: (tc.quantity_sold || 0) * multiplier,
      attendeeRemaining: ((tc.quantity_total || 0) - (tc.quantity_sold || 0)) * multiplier
    };
  });

  const totalAttendeeCapacity = tiers.reduce((sum, t) => sum + t.attendeeCapacity, 0);
  const totalAttendeeSold = tiers.reduce((sum, t) => sum + t.attendeeSold, 0);
  const totalAttendeeRemaining = totalAttendeeCapacity - totalAttendeeSold;
  const percentSold = totalAttendeeCapacity > 0 ? (totalAttendeeSold / totalAttendeeCapacity) * 100 : 0;

  const allSoldOut = admission.every(tc => tc.on_sale_status === 'SOLD_OUT');
  const anyAvailable = admission.some(tc => tc.on_sale_status === 'AVAILABLE');

  // ============================================================
  // Time awareness: is this event "this Saturday"?
  // From the Sunday before the event, it counts as event week.
  // ============================================================

  const now = new Date();
  const eventDay = eventDate ? new Date(eventDate) : null;
  const daysUntil = eventDay ? Math.ceil((eventDay - now) / (1000 * 60 * 60 * 24)) : 999;

  // "Event week" = from the Sunday before the event day
  // If event is Saturday, event week starts the preceding Sunday (6 days before)
  let isEventWeek = false;
  if (eventDay) {
    const eventDayOfWeek = eventDay.getDay(); // 0=Sun, 6=Sat
    const sundayBefore = new Date(eventDay);
    sundayBefore.setDate(eventDay.getDate() - (eventDayOfWeek === 0 ? 0 : eventDayOfWeek));
    sundayBefore.setHours(0, 0, 0, 0);
    isEventWeek = now >= sundayBefore && now <= eventDay;
  }

  // ============================================================
  // JD's urgency curve (v4, locked 2026-06-10)
  //
  // The two mechanics never fight: a count never sits next to a
  // group invitation.
  //
  // Phase 1: "Just announced"          - early days, low sales
  // Phase 2: "Selling fast"            - 15%+ sold
  // Phase 3: "75% sold"                - really at 67% (1/3 left)
  // Phase 4: "Final tickets"           - event week fallback
  // Phase 5: "Final release"           - final tier on sale, NO count
  //          (groups may still be on sale; group line shows)
  // Phase 6: "Final release: N left"   - count mode. ONLY when
  //          singles are the only thing on sale AND remaining
  //          singles <= the venue's countFrom. N rounds DOWN:
  //          100..25 -> nearest 25, 24..10 -> nearest 5,
  //          under 10 -> "Last few tickets". Never exact.
  // Phase 7: "Join waiting list"       - sold out
  // ============================================================

  const groupTiersAvailable = tiers.filter(
    t => t.attendeesPerTicket > 1 && t.status === 'AVAILABLE'
  );
  const singleTiersAvailable = tiers.filter(
    t => t.attendeesPerTicket === 1 && t.status === 'AVAILABLE'
  );
  const singlesRemaining = singleTiersAvailable.reduce(
    (sum, t) => sum + ((t.ticketCapacity || 0) - (t.ticketSold || 0)), 0
  );
  const finalPhase = tiers.some(
    t => /final/i.test(t.name) && t.status === 'AVAILABLE'
  );
  const countFrom = venueCountFrom(location);
  const countMode =
    finalPhase &&
    groupTiersAvailable.length === 0 &&
    singleTiersAvailable.length > 0 &&
    singlesRemaining <= countFrom;

  function roundedCountLabel(n) {
    if (n < 10) return 'Last few tickets';
    if (n < 25) return `Final release: ${Math.floor(n / 5) * 5} left`;
    return `Final release: ${Math.floor(n / 25) * 25} left`;
  }

  let statusLabel;
  let schemaAvailability;

  if (allSoldOut || totalAttendeeRemaining === 0) {
    statusLabel = 'Join waiting list';
    schemaAvailability = 'https://schema.org/SoldOut';
  } else if (countMode) {
    statusLabel = roundedCountLabel(singlesRemaining);
    schemaAvailability = 'https://schema.org/LimitedAvailability';
  } else if (finalPhase) {
    statusLabel = 'Final release';
    schemaAvailability = 'https://schema.org/LimitedAvailability';
  } else if (tiers.some(t => /early/i.test(t.name) && t.status === 'SOLD_OUT') && anyAvailable) {
    // Early tier gone, later tiers live. JD 2026-06-15: never say "sold out"
    // on an available event (reads as "can't go"). An early tier selling out
    // IS momentum, so say so positively.
    statusLabel = 'Selling fast';
    schemaAvailability = 'https://schema.org/LimitedAvailability';
  } else if (isEventWeek) {
    // Event week, plenty of stock: generic urgency
    statusLabel = 'Final tickets';
    schemaAvailability = 'https://schema.org/LimitedAvailability';
  } else if (percentSold >= 67) {
    // Reality: 1/3 left. Tell them: 75% sold
    statusLabel = '75% sold';
    schemaAvailability = 'https://schema.org/LimitedAvailability';
  } else if (percentSold >= 15) {
    // Real traction. General urgency.
    statusLabel = 'Selling fast';
    schemaAvailability = 'https://schema.org/InStock';
  } else if (anyAvailable) {
    // Early days, low sales
    statusLabel = 'Just announced';
    schemaAvailability = 'https://schema.org/InStock';
  } else {
    statusLabel = 'Coming soon';
    schemaAvailability = 'https://schema.org/PreOrder';
  }

  // JD 2026-06-15: no per-tier "sold out" lines on cards (same misread risk
  // as the badge: people think the event is gone). The badge carries honest
  // urgency; tier-sold-out lines are dropped.
  const tierLabels = [];

  // ============================================================
  // Group pricing (JD 2026-06-15): if a group ticket is on sale, lead with
  // the round total ("Group of 4 for £30"), NOT the saving (a small saving
  // is not a brag; the round price reads as a deal). If group prices vary
  // across tiers, say "Group offers available" rather than a confusing range.
  // If no group ticket is on sale, say nothing.
  // ============================================================
  let groupTicket;
  if (groupTiersAvailable.length > 0) {
    const g = [...groupTiersAvailable].sort((a, b) => a.price - b.price)[0];
    const distinctPrices = [...new Set(groupTiersAvailable.map(t => t.price))];
    groupTicket = {
      size: g.attendeesPerTicket,
      price: g.price,
      label: distinctPrices.length === 1
        ? `Group of ${g.attendeesPerTicket} for ${fmtPounds(g.price)}`
        : 'Group offers available'
    };
  }

  return {
    // Public fields (written to events.json)
    public: {
      price: parseFloat(cheapest.cost.major_value),
      priceCurrency: cheapest.cost.currency,
      priceLabel: `From ${cheapest.cost.display}`,
      availability: schemaAvailability,
      statusLabel,
      tierLabels: tierLabels.length > 0 ? tierLabels : undefined,
      groupTicket
    },
    // Internal fields (written to .ticket-data-internal.json only)
    internal: {
      totalAttendeeCapacity,
      totalAttendeeSold,
      totalAttendeeRemaining,
      percentSold: Math.round(percentSold),
      daysUntil,
      isEventWeek,
      tiers
    }
  };
}

// ============================================================
// Em dash sanitisation (house rule: no em dashes anywhere).
// Event titles and copy must never contain U+2014. Titles get
// ": " (reads as a subtitle separator); all other strings get
// " - ". Applied to every string field on every sync run so
// nothing upstream can reintroduce them.
// ============================================================

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

async function main() {
  const token = loadToken();
  console.log('Eventbrite price sync starting...');

  const events = JSON.parse(readFileSync(EVENTS_PATH, 'utf-8'));

  const sanitised = { count: 0 };
  sanitiseEmDashes(events, null, sanitised);
  if (sanitised.count > 0) {
    console.log(`Sanitised em dashes in ${sanitised.count} field(s).`);
  }
  const internalData = {};
  let updated = 0;
  let errors = 0;

  for (const event of events) {
    if (!event.eventbriteId) {
      console.log(`  SKIP: ${event.title} (no eventbriteId)`);
      continue;
    }

    console.log(`  Fetching: ${event.title} (${event.eventbriteId})`);

    try {
      const ticketClasses = await fetchTicketClasses(event.eventbriteId, token);
      const priceData = extractPriceData(ticketClasses, event.start, `${event.venue || ''}, ${event.city || ''}`);

      if (priceData) {
        // Public fields only in events.json
        event.price = priceData.public.price;
        event.priceCurrency = priceData.public.priceCurrency;
        event.priceLabel = priceData.public.priceLabel;
        event.availability = priceData.public.availability;
        // A bounded launch label can temporarily take precedence over the
        // computed urgency ladder without changing ticket inventory.
        event.statusLabel = launchStatusLabel(
          event,
          priceData.public.statusLabel,
          priceData.public.availability === 'https://schema.org/SoldOut',
        );
        // fomoOverride (the structured manual layer the UI prefers) is
        // cleared the moment a sold-out tier contradicts its message, so a
        // hand-set "EARLY RELEASE" can never outlive the early release.
        const fomoMsg = String(event.fomoOverride?.message || '').toLowerCase();
        if (fomoMsg) {
          const contradicted = (priceData.internal.tiers || []).some(t => {
            if (t.status !== 'SOLD_OUT') return false;
            const tier = String(t.name || '').toLowerCase().replace(/\s*tickets?\s*$/, '');
            return tier && fomoMsg.includes(tier.replace(/ ticket.*/, ''));
          });
          if (contradicted) {
            console.log(`    FOMO OVERRIDE CLEARED: "${event.fomoOverride.message}" contradicted by sold-out tier`);
            event.fomoOverride = null;
          }
        }
        if (priceData.public.tierLabels) {
          event.tierLabels = priceData.public.tierLabels;
        } else {
          delete event.tierLabels;
        }
        if (priceData.public.groupTicket) {
          event.groupTicket = priceData.public.groupTicket;
        } else {
          delete event.groupTicket;
        }
        event.isSoldOut = priceData.public.availability === 'https://schema.org/SoldOut';
        event.priceLastSync = new Date().toISOString();

        // Clean up any legacy fields that should never be public
        delete event.capacityTotal;
        delete event.ticketsSold;
        delete event.ticketsRemaining;
        delete event.tiers;

        // Internal data stored separately (gitignored)
        internalData[event.eventbriteId] = {
          title: event.title,
          slug: event.slug,
          ...priceData.internal,
          publicLabel: priceData.public.statusLabel,
          syncedAt: new Date().toISOString()
        };

        updated++;
        console.log(`    OK: ${priceData.public.priceLabel} | ${priceData.public.statusLabel} (real: ${priceData.internal.totalAttendeeRemaining} attendees left, ${priceData.internal.percentSold}% sold, ${priceData.internal.daysUntil}d away${priceData.internal.isEventWeek ? ' [EVENT WEEK]' : ''})`);
      } else {
        console.log(`    WARN: No price data extracted`);
      }
    } catch (err) {
      console.error(`    ERROR: ${err.message}`);
      errors++;
    }

    // Rate limit: small delay between calls
    await new Promise(r => setTimeout(r, 200));
  }

  // Write public data
  writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + '\n');

  // Write internal data (gitignored, never pushed)
  writeFileSync(INTERNAL_PATH, JSON.stringify(internalData, null, 2) + '\n');

  console.log(`\nDone. Updated ${updated} events, ${errors} errors.`);
  console.log(`Public:   ${EVENTS_PATH}`);
  console.log(`Internal: ${INTERNAL_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
