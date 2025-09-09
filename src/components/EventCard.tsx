import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Calendar, MapPin, Clock, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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

  // Sharing functions
  const buildUtmUrl = (baseUrl: string, source: string) => {
    if (!baseUrl) return '';
    const sep = baseUrl.includes('?') ? '&' : '?';
    return baseUrl + sep
      + 'utm_source=' + encodeURIComponent(source)
      + '&utm_medium=share_button'
      + '&utm_campaign=event_share';
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        document.body.removeChild(ta);
        return false;
      }
    }
  };

  const downloadICS = ({ title, startISO, endISO, location, description, url }: {
    title: string;
    startISO: string;
    endISO?: string;
    location?: string;
    description?: string;
    url: string;
  }) => {
    const toUTCstamp = (iso: string) => {
      const d = new Date(iso);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const uid = `${title.replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1e5)}@boombasticevents`;
    const dtstamp = toUTCstamp(new Date().toISOString());
    const dtstart = toUTCstamp(startISO);
    const dtend = toUTCstamp(endISO || new Date(new Date(startISO).getTime() + 2 * 60 * 60 * 1000).toISOString());
    
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Boombastic Events//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${title}`,
      `LOCATION:${location || ''}`,
      `DESCRIPTION:${description || ''} -- Tickets: ${url}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    const blob = new Blob([body], { type: 'text/calendar' });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = `${title.replace(/[^\w\-]+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  };

  const handleCalendarShare = () => {
    const utmUrl = buildUtmUrl(bookUrl, 'calendar');
    downloadICS({
      title,
      startISO: dateIso,
      location: `${venue}, ${city}`,
      description: `${title} at ${venue}`,
      url: utmUrl
    });
    toast({
      title: "Calendar event downloaded",
      description: "Open the file to add the event to your calendar.",
    });
    
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'calendar_share',
      eventId: slug,
      eventName: title
    });
  };

  const handleWhatsAppShare = () => {
    const utmUrl = buildUtmUrl(bookUrl, 'whatsapp');
    const text = `This event looks great - who's in? ✨\n${title} • ${date} • ${time}\nTickets: ${utmUrl}`;
    const wa = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(wa, '_blank');
    
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'whatsapp_share',
      eventId: slug,
      eventName: title
    });
  };

  const handleFacebookShare = () => {
    const utmUrl = buildUtmUrl(bookUrl, 'facebook');
    const fb = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(utmUrl);
    window.open(fb, '_blank', 'noopener');
    
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'facebook_share',
      eventId: slug,
      eventName: title
    });
  };

  const handleCopyLink = async () => {
    const utmUrl = buildUtmUrl(bookUrl, 'copy');
    const success = await copyText(utmUrl);
    
    if (success) {
      toast({
        title: "Link copied",
        description: "Paste into WhatsApp, Instagram or SMS.",
      });
    } else {
      window.open(utmUrl, '_blank');
    }
    
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: 'copy_link_share',
      eventId: slug,
      eventName: title
    });
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
        
        {/* Share icons row */}
        <div className="share-icons" role="group" aria-label="Share event">
          <button 
            className="icon-btn icon-calendar" 
            onClick={handleCalendarShare}
            title="Add to Calendar" 
            aria-label="Add to Calendar" 
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM5 20V9h14l.002 11H5z"/>
            </svg>
          </button>

          <button 
            className="icon-btn icon-whatsapp" 
            onClick={handleWhatsAppShare}
            title="Share with friends on WhatsApp" 
            aria-label="Share with friends on WhatsApp" 
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.149-.672.15-.2.297-.77.967-.945 1.165-.173.2-.347.224-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.2 0-.373-.049-.522-.049-.149-.672-1.612-.92-2.21-.242-.579-.487-.5-.672-.51l-.573-.01c-.2 0-.52.074-.793.373-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.878 1.213 3.078.149.2 2.095 3.2 5.076 4.487 2.98 1.29 2.98.861 3.51.81.53-.05 1.758-.717 2.006-1.41.248-.694.248-1.287.173-1.41-.074-.122-.272-.198-.57-.347zM12.004 2a9.99 9.99 0 0 0-8.896 14.918L2 22l5.31-1.395A9.99 9.99 0 1 0 12.004 2z"/>
            </svg>
          </button>

          <button 
            className="icon-btn icon-facebook" 
            onClick={handleFacebookShare}
            title="Share this event to Facebook" 
            aria-label="Share this event to Facebook" 
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.9v-7H8.5v-3h2V9.2c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0 0 22 12z"/>
            </svg>
          </button>

          <button 
            className="icon-btn icon-copy" 
            onClick={handleCopyLink}
            title="Copy event link" 
            aria-label="Copy event link" 
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M3.9 12a3 3 0 0 1 0-4.2l2.4-2.4a3 3 0 1 1 4.24 4.24L8.2 12l2.36 2.36a3 3 0 1 1-4.24 4.24L3.9 16.2A3 3 0 0 1 3.9 12zm12.2-6.2a3 3 0 0 1 4.24 4.24L16.8 12l2.36 2.36a3 3 0 1 1-4.24 4.24L12.76 16.2a3 3 0 0 1 0-4.24L15.06 9.96z"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;