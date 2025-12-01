import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import EventPageSimple from "@/components/EventPageSimple";
import TwoPmClubEventPage, { TwoPmClubEvent } from "@/components/TwoPmClubEventPage";
import NotFound from "./NotFound";

interface EventData {
  eventCode: string;
  title: string;
  subtitle?: string;
  date: string;
  timeDisplay: string;
  venue: string;
  city: string;
  image: string;
  description: string;
  eventbriteId: string;
  isSoldOut?: boolean;
  waitingListUrl?: string;
  // Extended fields for 2PM Club events
  fullDescription?: string;
  highlights?: string;
  promoCode?: string;
  bookUrl?: string;
  infoUrl?: string;
  start?: string;
  end?: string;
}

const EventTemplate = () => {
  const { eventCode } = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/events-boombastic.json')
      .then(res => res.json())
      .then((events: EventData[]) => {
        // Case-insensitive matching
        const normalizedCode = eventCode?.toUpperCase();
        const found = events.find(e => e.eventCode.toUpperCase() === normalizedCode);
        setEvent(found || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [eventCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return <NotFound />;
  }

  // Smart template selection based on event type code
  const is2PMClubEvent = event.eventCode.includes('-2PM-');
  
  if (is2PMClubEvent) {
    // Map EventData to TwoPmClubEvent format
    const twoPmEvent: TwoPmClubEvent = {
      slug: event.eventCode.toLowerCase(),
      eventType: event.eventCode.split('-')[1] || '2PM',
      cityCode: event.eventCode.split('-')[2] || '',
      eventbriteId: event.eventbriteId,
      promoCode: event.promoCode,
      isSoldOut: event.isSoldOut,
      waitingListUrl: event.waitingListUrl,
      title: event.title,
      location: `${event.venue}, ${event.city}`,
      start: event.start || event.date,
      end: event.end || event.date,
      bookUrl: event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
      infoUrl: event.infoUrl || event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
      image: event.image,
      description: event.description,
      subtitle: event.subtitle || '',
      fullDescription: event.fullDescription || event.description,
      highlights: event.highlights || '',
    };
    
    return <TwoPmClubEventPage event={twoPmEvent} />;
  }
  
  return <EventPageSimple event={event} />;
};

export default EventTemplate;
