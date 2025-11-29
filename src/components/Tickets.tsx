import React, { useEffect, useState } from 'react';
import { EventCard } from './EventCard';

interface Event {
  id: number;
  eventCode: string;
  title: string;
  location: string;
  start: string;
  end: string;
  bookUrl: string;
  image: string;
  description: string;
  price?: string;
  badge?: string;
  buttonText?: string;
}

const Tickets = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('/events.json')
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startTime = start.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const endTime = end.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${startTime} - ${endTime}`;
  };

  const dateToIso = (dateString: string): string => {
    return dateString.split('T')[0];
  };

  return (
    <section id="tickets" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Upcoming Dates
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get your tickets now for the best parties in the Midlands. From 80s nights to family-friendly silent discos, 
            we've got something for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={formatDate(event.start)}
              venue={event.location}
              time={formatTime(event.start, event.end)}
              poster={event.image}
              eventCode={event.eventCode}
              isoDate={dateToIso(event.start)}
              badge={event.badge}
              buttonText={event.buttonText}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tickets;