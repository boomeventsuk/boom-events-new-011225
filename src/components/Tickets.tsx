import React, { useEffect, useState } from 'react';
import { EventCard } from './EventCard';
import { isEventPassed } from '@/lib/eventUtils';

interface FomoOverride {
  tier: string;
  message: string;
  timeMessage?: string | null;
}

interface Event {
  eventCode: string;
  title: string;
  subtitle?: string;
  date: string;
  timeDisplay: string;
  start?: string;
  end?: string;
  venue: string;
  city: string;
  image: string;
  description: string;
  eventbriteId: string;
  isSoldOut?: boolean;
  isHidden?: boolean;
  fullDescription?: string;
  highlights?: string[];
  fomoOverride?: FomoOverride;
}

const isChristmasDay = () => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 25;
};

const Tickets = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('/events-boombastic.json')
      .then(response => response.json())
      .then(data => setEvents(data))
      .catch(error => console.error('Error loading events:', error));

    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'view_tickets_list',
        event_category: 'Page View',
        event_label: 'Tickets Section',
      });
    }
  }, []);

  const extractIsoDate = (eventCode: string): string => {
    // eventCode format: "061225-2PM-NPTON" → "2025-12-06"
    const dateStr = eventCode.split('-')[0]; // "061225"
    const day = dateStr.slice(0, 2);
    const month = dateStr.slice(2, 4);
    const year = '20' + dateStr.slice(4, 6);
    return `${year}-${month}-${day}`;
  };

  return (
    <section id="tickets" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {isChristmasDay() ? "🎄 Merry Christmas! 🎄" : "Upcoming Dates"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isChristmasDay() 
              ? "Hope you're having a wonderful day! Here's what we've got coming up for you in the New Year."
              : "Get your tickets now for the best parties in the Midlands. From 80s nights to family-friendly silent discos, we've got something for everyone."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events
            .filter(event => !event.isHidden && !isEventPassed(event))
            .sort((a, b) => {
              const dateA = a.start ? new Date(a.start).getTime() : 0;
              const dateB = b.start ? new Date(b.start).getTime() : 0;
              return dateA - dateB;
            })
            .map((event) => (
              <EventCard
                key={event.eventCode}
                title={event.title}
                date={event.date}
                venue={`${event.venue}, ${event.city}`}
                time={event.timeDisplay}
                poster={event.image}
                eventCode={event.eventCode}
                isoDate={extractIsoDate(event.eventCode)}
                badge={event.isSoldOut ? "SOLD OUT" : undefined}
                fomoOverride={event.fomoOverride}
              />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Tickets;