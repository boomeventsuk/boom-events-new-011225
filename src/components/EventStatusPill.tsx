import { eventDateProximityLabel } from '@/lib/eventDateProximity';

/**
 * The small pill in an event hero.
 *
 * It normally carries the scarcity ladder from the Eventbrite sync ("Selling
 * fast", "Final release"). When the event is close it leads with the day
 * instead, because "TOMORROW" is a stronger reason to book than "Selling fast"
 * and the visitor can read the exact date immediately below anyway.
 *
 * JD 18th September 2026 asked for the date to live here rather than in a
 * full-width strip, with a flash to carry the urgency.
 *
 * The day is recomputed from the event's own start on every render, never read
 * from a stored label, so neither the three-times-daily sync nor a static shell
 * built days ago can put a wrong day in front of anyone.
 */
interface EventStatusPillProps {
  start?: string;
  statusLabel?: string;
  isSoldOut?: boolean;
  /** Layout only, e.g. "mb-6". Visual styling stays owned by this component. */
  className?: string;
}

const BASE =
  'inline-flex rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary';

export const EventStatusPill = ({
  start,
  statusLabel,
  isSoldOut,
  className = '',
}: EventStatusPillProps) => {
  // Sold out hid this pill before and still does; that state has its own copy.
  if (isSoldOut) return null;

  const dateLabel = start ? eventDateProximityLabel(start) : null;
  const label = dateLabel || statusLabel;
  if (!label) return null;

  const tone = dateLabel
    ? 'border-primary/70 bg-primary/25 event-status-pill-urgent'
    : 'border-primary/40 bg-primary/15';

  return <div className={`${BASE} ${tone} ${className}`.trim()}>{label}</div>;
};

export default EventStatusPill;
