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
            className="bg-white text-primary border-white hover:bg-white/90 flex items-center justify-center gap-2 btn"
          >
            <ExternalLink className="w-4 h-4" />
            Event Info
          </Button>
        )}
        <span className="status" data-status></span>
        
        <p className="font-poppins text-white text-sm text-left">Share This Event</p>
        
        {/* Share icons row */}
        <div className="share-icons" role="group" aria-label="Share event">
          <button 
            className="icon-btn icon-whatsapp" 
            onClick={handleWhatsAppShare}
            title="Share with friends on WhatsApp" 
            aria-label="Share with friends on WhatsApp" 
            type="button"
          >
            <img src="https://res.cloudinary.com/dteowuv7o/image/upload/v1757519736/bb7f178c-1cf5-4ce2-a752-a39c92c097f7_cbk3z9.png" alt="Share on WhatsApp" width="22" height="22" loading="lazy" decoding="async" />
          </button>

          <button 
            className="icon-btn icon-facebook" 
            onClick={handleFacebookShare}
            title="Share this event to Facebook" 
            aria-label="Share this event to Facebook" 
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="28" height="28">
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
              <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
};

export default EventCard;