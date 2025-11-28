import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import EventPageSimple from "@/components/EventPageSimple";
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
}

const EventTemplate = () => {
  const { eventCode } = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/events-boombastic.json')
      .then(res => res.json())
      .then((events: EventData[]) => {
        const found = events.find(e => e.eventCode === eventCode);
        setEvent(found || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [eventCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return <NotFound />;
  }
  
  return <EventPageSimple event={event} />;
};

export default EventTemplate;
