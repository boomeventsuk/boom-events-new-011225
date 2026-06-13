export interface TwoPmEditionEvent {
  eventCode?: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  fullDescription?: string;
  highlights?: string;
  city?: string;
  venue?: string;
  location?: string;
  start?: string;
  image?: string;
}

const EIGHTIES_PATTERN = /80s edition|2pm80s|2pm-80s|goes full-on 80s|your best 80s night out/i;
const OLD_DECADES_PATTERN = /80s\s*,?\s*90s|90s\s*(and|&)\s*00s|80s\/90s\/00s|00s anthems/i;

export const EIGHTIES_EVENT_SUBLINE = "Your best 80s night out. In the middle of the afternoon.";
export const EIGHTIES_MUSIC_LINE = "Iconic 80s anthems.";
export const EIGHTIES_MUSIC_FAQ = "80s anthems. Wall-to-wall songs you know every word to. Think Whitney, Wham!, Madonna, Bon Jovi, Queen, Cyndi Lauper and A-ha.";
export const EIGHTIES_HIGHLIGHTS = [
  "80S ONLY. WALL-TO-WALL: Madonna, Michael Jackson, Wham!, Whitney, Prince, Bon Jovi, Duran Duran, Queen, Cyndi Lauper and A-ha.",
  "DAYTIME PARTY, NIGHT-OUT VIBES: Club-level production, confetti moments and a full dance floor from 2pm to 6pm.",
  "THE PLAN EVERYONE SAYS YES TO: A proper afternoon out with your favourite people, and still home by 7ish.",
  "NO SUNDAY REGRETS: Big singalongs, big energy, and a clear head the next morning.",
].join("|");

const eventCity = (event: TwoPmEditionEvent) =>
  event.city || event.location?.split(",").pop()?.trim() || event.eventCode?.split("-")[2] || "";

const eventVenue = (event: TwoPmEditionEvent) =>
  event.venue || (event.location?.includes(",") ? event.location.split(",").slice(0, -1).join(",").trim() : "");

export const isTwoPmEightiesEdition = (event?: TwoPmEditionEvent | null): boolean => {
  if (!event) return false;

  const searchable = [
    event.eventCode,
    event.slug,
    event.title,
    event.subtitle,
    event.description,
    event.fullDescription,
    event.highlights,
    event.image,
  ].filter(Boolean).join(" ");

  return EIGHTIES_PATTERN.test(searchable);
};

export const twoPmDisplayTitle = (event: TwoPmEditionEvent): string => {
  if (!isTwoPmEightiesEdition(event)) return event.title || "";
  const city = eventCity(event);
  return `THE 2PM CLUB ${city}: 80s Edition Daytime Disco`.replace(/\s+:/, ":").trim();
};

export const twoPmDisplayDescription = (event: TwoPmEditionEvent): string => {
  if (!isTwoPmEightiesEdition(event) && event.description) return event.description;
  const venue = eventVenue(event);
  const city = eventCity(event);
  const place = [venue, city].filter(Boolean).join(", ");
  return place
    ? `THE 2PM CLUB goes full-on 80s at ${place}. ${EIGHTIES_EVENT_SUBLINE}`
    : EIGHTIES_EVENT_SUBLINE;
};

export const twoPmDisplayFullDescription = (event: TwoPmEditionEvent): string => {
  if (!isTwoPmEightiesEdition(event)) return event.fullDescription || event.description || "";
  const current = event.fullDescription || "";
  if (current && !OLD_DECADES_PATTERN.test(current)) return current;

  const venue = eventVenue(event);
  const city = eventCity(event);
  const place = [venue, city].filter(Boolean).join(", ");
  const opener = place
    ? `THE 2PM CLUB goes full-on 80s at ${place}.`
    : "THE 2PM CLUB goes full-on 80s for one afternoon only.";
  return [
    opener,
    EIGHTIES_EVENT_SUBLINE,
    "Four hours of iconic 80s anthems, confetti moments, club-level production and a room full of people who know every word too.",
    "You get the singalong, the dancing, the proper night-out energy - and you're still home by 7ish.",
  ].join("\n\n");
};

export const twoPmDisplayHighlights = (event: TwoPmEditionEvent): string => {
  if (!isTwoPmEightiesEdition(event)) return event.highlights || "";
  const current = event.highlights || "";
  return current && !OLD_DECADES_PATTERN.test(current) ? current : EIGHTIES_HIGHLIGHTS;
};

export const normaliseTwoPmEditionEvent = <T extends TwoPmEditionEvent>(event: T): T => {
  if (!isTwoPmEightiesEdition(event)) return event;
  return {
    ...event,
    title: twoPmDisplayTitle(event),
    subtitle: EIGHTIES_EVENT_SUBLINE,
    description: twoPmDisplayDescription(event),
    fullDescription: twoPmDisplayFullDescription(event),
    highlights: twoPmDisplayHighlights(event),
  };
};
