import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import EventPageSimple from "@/components/EventPageSimple";
import TwoPmClubEventPage, { TwoPmClubEvent } from "@/components/TwoPmClubEventPage";
import SilentDiscoEventPage, { SilentDiscoEvent, SilentDiscoChannel } from "@/components/SilentDiscoEventPage";
import FamilySilentDiscoEventPage, { FamilySilentDiscoEvent } from "@/components/FamilySilentDiscoEventPage";
import FootlooseEventPage, { FootlooseEvent } from "@/components/FootlooseEventPage";
import GetReadyEventPage, { GetReadyEvent } from "@/components/GetReadyEventPage";
import NotFound from "./NotFound";
import { isEventPassed } from "@/lib/eventUtils";

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
  isHidden?: boolean;
  waitingListUrl?: string;
  // Extended fields for rich event pages
  fullDescription?: string;
  highlights?: string;
  promoCode?: string;
  bookUrl?: string;
  infoUrl?: string;
  start?: string;
  end?: string;
  // Silent Disco specific fields
  channels?: SilentDiscoChannel[];
  hiddenSections?: string[];
  // Footloose 80s specific fields
  soundtrack?: string;
  // Family Silent Disco specific
  doorsTime?: string;
  // GET READY specific
  isAfternoon?: boolean;
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

  if (!event || event.isHidden || isEventPassed(event)) {
    return <NotFound />;
  }

  // Smart template selection based on event type code
  const is2PMClubEvent = event.eventCode.includes('-2PM-');
  const isFamilySilentDiscoEvent = event.eventCode.includes('-FSD-');
  const isSilentDiscoEvent = event.eventCode.includes('-SD-') && !isFamilySilentDiscoEvent;
  const isFootlooseEvent = event.eventCode.includes('-FL80-');
  const isGetReadyEvent = event.eventCode.includes('-GR-');
  
  if (isGetReadyEvent && event.soundtrack) {
    // Map EventData to GetReadyEvent format
    const getReadyEvent: GetReadyEvent = {
      slug: event.eventCode.toLowerCase(),
      eventbriteId: event.eventbriteId,
      promoCode: event.promoCode,
      isSoldOut: event.isSoldOut,
      title: event.title,
      location: `${event.venue}, ${event.city}`,
      city: event.city,
      start: event.start || event.date,
      end: event.end || event.date,
      bookUrl: event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
      image: event.image,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      highlights: event.highlights || '',
      soundtrack: event.soundtrack,
      hiddenSections: event.hiddenSections,
      isAfternoon: event.isAfternoon,
    };
    
    return <GetReadyEventPage event={getReadyEvent} />;
  }
  
  if (isFootlooseEvent && event.soundtrack) {
    // Map EventData to FootlooseEvent format
    const footlooseEvent: FootlooseEvent = {
      slug: event.eventCode.toLowerCase(),
      eventbriteId: event.eventbriteId,
      promoCode: event.promoCode,
      isSoldOut: event.isSoldOut,
      title: event.title,
      location: `${event.venue}, ${event.city}`,
      city: event.city,
      start: event.start || event.date,
      end: event.end || event.date,
      bookUrl: event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
      image: event.image,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      highlights: event.highlights || '',
      soundtrack: event.soundtrack,
      hiddenSections: event.hiddenSections,
    };
    
    return <FootlooseEventPage event={footlooseEvent} />;
  }
  
  if (isFamilySilentDiscoEvent && event.channels) {
    // Map EventData to FamilySilentDiscoEvent format
    const familySDEvent: FamilySilentDiscoEvent = {
      slug: event.eventCode.toLowerCase(),
      eventbriteId: event.eventbriteId,
      promoCode: event.promoCode,
      isSoldOut: event.isSoldOut,
      title: event.title,
      subtitle: event.subtitle,
      location: `${event.venue}, ${event.city}`,
      city: event.city,
      start: event.start || event.date,
      end: event.end || event.date,
      doorsTime: event.doorsTime,
      bookUrl: event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
      image: event.image,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      highlights: event.highlights || '',
      channels: event.channels,
      hiddenSections: event.hiddenSections,
    };
    
    return <FamilySilentDiscoEventPage event={familySDEvent} />;
  }

  if (isSilentDiscoEvent && event.channels) {
    // Map EventData to SilentDiscoEvent format
    const silentDiscoEvent: SilentDiscoEvent = {
      slug: event.eventCode.toLowerCase(),
      eventbriteId: event.eventbriteId,
      promoCode: event.promoCode,
      isSoldOut: event.isSoldOut,
      title: event.title,
      location: `${event.venue}, ${event.city}`,
      start: event.start || event.date,
      end: event.end || event.date,
      bookUrl: event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
      image: event.image,
      description: event.description,
      subtitle: event.subtitle || '',
      fullDescription: event.fullDescription || event.description,
      highlights: event.highlights || '',
      channels: event.channels,
      hiddenSections: event.hiddenSections,
    };
    
    return <SilentDiscoEventPage event={silentDiscoEvent} />;
  }
  
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
