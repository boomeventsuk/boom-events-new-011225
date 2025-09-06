import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Calendar, MapPin, Clock } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  venue: string;
  city: string;
  time: string;
  poster: string;
  bookUrl: string;
  infoUrl?: string;
  dateIso: string;
}

const EventCard = ({ title, date, venue, city, time, poster, bookUrl, infoUrl, dateIso }: EventCardProps) => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  const handleBookNow = () => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'ticket_click',
      eventId: slug,
      eventName: title,
      venue: venue,
      price: "TICKET_PRICE"
    });
    window.open(bookUrl, '_blank', 'noopener');
  };

  const handleEventInfo = () => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'view_event',
      eventId: slug,
      eventName: title
    });
    if (infoUrl) {
      window.open(infoUrl, '_blank', 'noopener');
    }
  };

  return (
    <article className="ticket-card" data-ticket-card data-date-iso={dateIso}>
      <div className="poster">
        <img 
          src={poster}
          alt={`${title} event poster`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          width="800"
          height="1200"
          style={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
        />
      </div>
      
      <div className="meta">
        <h3 className="font-bebas text-2xl font-bold text-foreground mb-3 leading-tight">
          {title}
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2 text-primary" />
            <span className="font-poppins">{date}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            <span className="font-poppins">{venue}, {city}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            <span className="font-poppins">{time}</span>
          </div>
        </div>
      </div>
      
      <div className="actions">
        <Button 
          onClick={handleBookNow}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 btn"
        >
          <ExternalLink className="w-4 h-4" />
          Book Now
        </Button>
        {infoUrl && (
          <Button 
            onClick={handleEventInfo}
            variant="outline"
            className="border-border text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 btn"
          >
            <ExternalLink className="w-4 h-4" />
            Event Info
          </Button>
        )}
        <span className="status" data-status></span>
      </div>
    </article>
  );
};

export default EventCard;