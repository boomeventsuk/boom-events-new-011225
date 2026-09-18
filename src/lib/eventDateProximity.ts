/**
 * Relative date wording for the event page urgency banner.
 *
 * Boombastic events are almost all Saturdays, so in the run-up the most
 * persuasive thing a ticket page can say is how close the event is. Every label
 * here is derived from the event's own start date and never hard-coded to a
 * weekday, so an event moved to a Friday says "THIS FRIDAY" on its own.
 *
 * Deliberately pure and time-injectable so the wording can be proved against
 * simulated dates, and deliberately NOT persisted anywhere. The Eventbrite
 * sync writes public/events-boombastic.json on a cron and the static event shells are
 * rebuilt only on deploy, so any stored relative label outlives the day it was
 * true for. A page that says TOMORROW the day after the event is far worse
 * than a page that says nothing, so the wording is recomputed from the
 * immutable `start` on every render instead.
 *
 * All arithmetic runs in Europe/London civil days. These are UK events and the
 * page already prints UK dates, so "TOMORROW" must mean tomorrow in Britain
 * whatever the visitor's own clock is set to.
 */

const UK_TIME_ZONE = 'Europe/London';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const WEEKDAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

// Whole days since the epoch, counted in UK civil days. Going through
// Date.UTC on the UK calendar parts keeps the arithmetic immune to British
// Summer Time: an event at 14:00+01:00 and a visitor at 23:30 GMT both land on
// the day a person in Britain would name.
const ukDayNumber = (date: Date): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day')) / MS_PER_DAY;
};

const weekdayName = (dayNumber: number): string =>
  WEEKDAY_NAMES[new Date(dayNumber * MS_PER_DAY).getUTCDay()];

// Sunday-anchored index of the week a day falls in, so "from the Sunday before
// the event onwards" and "the following week" are both integer comparisons.
const weekStartDayNumber = (dayNumber: number): number =>
  dayNumber - new Date(dayNumber * MS_PER_DAY).getUTCDay();

/**
 * Banner headline wording for how close an event is, or null when proximity
 * should not lead and the existing scarcity wording should be left alone.
 *
 * TODAY, TOMORROW, THIS SATURDAY (any day from the Sunday that begins the
 * event's own week), NEXT SATURDAY (the week after the visitor's current
 * week), then nothing further out than that. A past date returns null so a
 * stale bookmark or a cached page can never advertise an event that has been
 * and gone.
 *
 * Cancelled and sold-out events are the caller's responsibility: this function
 * only knows about dates.
 */
export const eventDateProximityLabel = (
  startIso: string,
  now: Date = new Date(),
): string | null => {
  if (!startIso) return null;

  // This site's feed stores naive local times ("2026-09-19T14:00:00") with no
  // offset, unlike the2pmclub which carries "+01:00". new Date() would read a
  // naive string in the VISITOR's zone, so someone abroad could be shown the
  // wrong day. These are UK events and the string is already a UK wall clock,
  // so take its calendar date verbatim and skip timezone parsing entirely.
  const naiveDate = /^(\d{4})-(\d{2})-(\d{2})T[\d:.]+$/.exec(startIso);
  let eventDay: number;
  if (naiveDate) {
    eventDay =
      Date.UTC(Number(naiveDate[1]), Number(naiveDate[2]) - 1, Number(naiveDate[3])) /
      MS_PER_DAY;
  } else {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return null;
    eventDay = ukDayNumber(start);
  }
  const today = ukDayNumber(now);
  const daysUntil = eventDay - today;

  if (daysUntil < 0) return null;
  if (daysUntil === 0) return 'TODAY';
  if (daysUntil === 1) return 'TOMORROW';

  const weeksAway = (weekStartDayNumber(eventDay) - weekStartDayNumber(today)) / 7;
  if (weeksAway === 0) return `THIS ${weekdayName(eventDay)}`;
  if (weeksAway === 1) return `NEXT ${weekdayName(eventDay)}`;
  return null;
};

/**
 * The scarcity wording that is allowed to outrank the date.
 *
 * JD 18th September 2026: "sometimes it might be ticket-sensitive and things
 * actually need to change due to sales". A near-empty room is a date problem, a
 * near-full one is a supply problem, and only the supply problem should push
 * the day off the pill.
 *
 * This list is deliberately tiny and closed. "Final release" is a TICKET TIER
 * NAME, not a shortage: the Silent Disco carries it with roughly 98 tickets
 * left. "Selling fast", "Over two-thirds sold", "General release now open" and
 * "Just announced" are momentum or availability copy, not scarcity either. None
 * of them may beat TOMORROW.
 */
export const GENUINE_SCARCITY_LABELS = [
  'join waiting list',
  'last few tickets',
  'final tickets',
] as const;

/**
 * True only for the closed set above, matched case-insensitively so a feed that
 * starts sending "Last Few Tickets" is still understood.
 */
export const isGenuineScarcityLabel = (label?: string | null): boolean =>
  typeof label === 'string' &&
  (GENUINE_SCARCITY_LABELS as readonly string[]).includes(label.trim().toLowerCase());

export interface EventUrgencyLabel {
  /** What to render, or null when the surface should show nothing. */
  text: string | null;
  /**
   * True only when `text` is a relative date. Surfaces use this to decide
   * whether to add the glow, so scarcity never borrows the date's urgency.
   */
  isDate: boolean;
}

/**
 * The one precedence rule shared by every surface that shows an event pill:
 * the hero pill, the homepage card and the static location pages.
 *
 * 1. Genuine scarcity wins, because running out of tickets is the only fact
 *    that beats how soon the night is.
 * 2. Otherwise the date, when the event is close enough to have one.
 * 3. Otherwise the scarcity ladder as synced from Eventbrite.
 *
 * Sold out is NOT handled here. Each surface already has its own sold-out copy
 * (the hero pill hides, the card says SOLD OUT, the location card keeps its
 * fomo badge) and those stay as they were, so callers deal with it before
 * calling in.
 *
 * `now` is injectable so the wording can be proved against simulated dates, and
 * the date is recomputed on every render rather than stored, because a page
 * that says TOMORROW the day after the event is far worse than one that says
 * nothing.
 */
export const eventUrgencyLabel = (
  start?: string | null,
  statusLabel?: string | null,
  now: Date = new Date(),
): EventUrgencyLabel => {
  if (isGenuineScarcityLabel(statusLabel)) {
    return { text: statusLabel as string, isDate: false };
  }
  const dateLabel = start ? eventDateProximityLabel(start, now) : null;
  if (dateLabel) return { text: dateLabel, isDate: true };
  return { text: statusLabel || null, isDate: false };
};
