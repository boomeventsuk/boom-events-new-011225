const UK_TIME_ZONE = "Europe/London";

const ordinalSuffix = (n: number): string => {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] || "th";
};

/**
 * House date style: "Sat 13th Jun 2026" (short day, ordinal, short month).
 * Pass withYear=false for the card-overlay form "Sat 13th Jun".
 */
export const formatHouseDate = (iso?: string, withYear = true): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UK_TIME_ZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(d).map(({ type, value }) => [type, value])
  );
  const day = Number(parts.day);
  const base = `${parts.weekday} ${day}${ordinalSuffix(day)} ${parts.month}`;
  return withYear ? `${base} ${parts.year}` : base;
};

/**
 * Canonical site path for an event: lowercase, trailing slash.
 * Always link to this form - uppercase /event/{CODE} 301s.
 */
export const isTwoPmEvent = (eventCode?: string): boolean =>
  /-2PM-/i.test(eventCode || "");

export const canonicalTwoPmCode = (eventCode: string): string =>
  eventCode.toUpperCase() === "250726-2PM-NPTON"
    ? "031026-2PM-NPTON"
    : eventCode;

export const eventPath = (eventCode: string): string =>
  isTwoPmEvent(eventCode)
    ? `https://www.the2pmclub.co.uk/events/${canonicalTwoPmCode(eventCode).toLowerCase()}/`
    : `/event/${eventCode.toLowerCase()}/`;

/**
 * "From £10.00" -> "From £10" (keeps non-zero pence: "From £8.50").
 */
export const formatPriceLabel = (label?: string): string =>
  label ? label.replace(/\.00\b/, "") : "";

export const customerPriceLabel = (eventCode: string, label?: string): string => {
  const clean = formatPriceLabel(label);
  if (!clean || !isTwoPmEvent(eventCode) || /booking fee/i.test(clean)) return clean;
  return `${clean} + booking fee`;
};

export const customerStatusLabel = (
  eventCode: string,
  sourceLabel?: string,
  isSoldOut = false,
): string | undefined => {
  if (!isSoldOut && eventCode.toUpperCase() === "250726-2PM-NPTON") {
    return "Final 25 tickets";
  }
  return sourceLabel;
};

// Emoji / pictograph ranges plus the ZWJ + variation selectors used to
// join them. Strips decorative emoji that arrive in machine-owned feed
// copy so the brand pages never render them (house rule: no emoji in copy).
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;

/**
 * Remove emoji and tidy the whitespace they leave behind.
 */
export const stripEmoji = (text?: string): string =>
  (text || "")
    .replace(EMOJI_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,!?])/g, "$1")
    .trim();

interface FeedUrgencyFields {
  isSoldOut?: boolean;
  statusLabel?: string;
  priceLabel?: string;
  groupTicket?: { label?: string } | null;
}

/**
 * Compose the booking-urgency line entirely from live feed fields.
 * Order: statusLabel, then price ("From £8.50"), then group line.
 * No hardcoded prices, ticket counts, emoji or em dashes. Returns
 * undefined when there is nothing feed-driven to show, so callers fall
 * back to their own neutral default copy.
 */
export const buildFeedUrgency = (event: FeedUrgencyFields): string | undefined => {
  if (event.isSoldOut) return event.statusLabel || undefined;
  const parts = [
    event.statusLabel,
    formatPriceLabel(event.priceLabel),
    event.groupTicket?.label,
  ].filter((p): p is string => Boolean(p && p.trim()));
  return parts.length ? parts.join(". ") : undefined;
};

/**
 * Check if an event has passed based on its end time or start time
 * @param event - Event object with start/end fields or eventCode for date extraction
 * @returns true if the event has passed
 */
export const isEventPassed = (event: {
  end?: string;
  start?: string;
  eventCode?: string;
}): boolean => {
  const now = new Date();
  
  // Prefer end time if available (event is over when end time passes)
  if (event.end) {
    const endDate = new Date(event.end);
    return now > endDate;
  }
  
  // Fall back to start time if no end time
  if (event.start) {
    const startDate = new Date(event.start);
    // Add a buffer (e.g., 4 hours for typical event duration)
    startDate.setHours(startDate.getHours() + 4);
    return now > startDate;
  }
  
  // Fall back to extracting date from eventCode (DDMMYY format)
  if (event.eventCode) {
    const dateStr = event.eventCode.split('-')[0];
    if (dateStr && dateStr.length === 6) {
      const day = parseInt(dateStr.slice(0, 2), 10);
      const month = parseInt(dateStr.slice(2, 4), 10) - 1; // JS months are 0-indexed
      const year = 2000 + parseInt(dateStr.slice(4, 6), 10);
      
      // Set to end of that day (23:59:59)
      const eventDate = new Date(year, month, day, 23, 59, 59);
      return now > eventDate;
    }
  }
  
  return false;
};
