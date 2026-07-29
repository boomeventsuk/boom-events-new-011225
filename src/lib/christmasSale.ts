const CHRISTMAS_2026_EVENT_CODES = new Set([
  '281126-2PM-LEIC',
  '041226-SD-NPTON',
  '051226-2PM-NPTON',
  '051226-DEC-NPTON',
  '061226-FSD-NPTON',
  '121226-2PM-NPTON',
  '191226-2PM-COV',
  '191226-2PM-BED',
]);

export const CHRISTMAS_2026_SALE_START = Date.parse('2026-07-31T11:00:00Z');
export const CHRISTMAS_2026_LAUNCH_LABEL_END = Date.parse('2026-08-02T23:00:00Z');

const isChristmasLaunchEvent = (eventCode?: string) =>
  Boolean(eventCode && CHRISTMAS_2026_EVENT_CODES.has(eventCode.toUpperCase()));

export const christmasSalePageLabel = (
  eventCode: string | undefined,
  fallback?: string,
  isSoldOut = false,
  now = Date.now(),
) => {
  if (isSoldOut || !isChristmasLaunchEvent(eventCode)) return fallback;
  if (now < CHRISTMAS_2026_SALE_START) return 'Tickets on sale Friday at 12 noon';
  if (now < CHRISTMAS_2026_LAUNCH_LABEL_END) return 'Tickets on sale now';
  return fallback;
};

export const christmasSaleBadgeLabel = (
  eventCode: string | undefined,
  fallback?: string,
  isSoldOut = false,
  now = Date.now(),
) => {
  if (isSoldOut || !isChristmasLaunchEvent(eventCode)) return fallback;
  if (now < CHRISTMAS_2026_SALE_START) return 'ON SALE FRI';
  if (now < CHRISTMAS_2026_LAUNCH_LABEL_END) return 'ON SALE NOW';
  return fallback;
};
