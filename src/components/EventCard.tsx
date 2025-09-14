import React from "react";
import slugify from "slugify";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export interface EventCardProps {
  title: string;
  date: string;
  venue: string;
  time: string;
  poster: string;
  bookUrl: string;
  infoUrl?: string;
  isoDate: string;
  slug?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  venue,
  time,
  poster,
  bookUrl,
  infoUrl,
  isoDate,
  slug,
}) => {
  const { toast } = useToast();
  const resolvedSlug = slug || slugify(title || 'event', { lower: true, strict: true });
  const eventUrl = `/events/${resolvedSlug}/`;

  const handleBookNow = () => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'book_now_click',
        event_category: 'Tickets',
        event_label: title,
        event_date: isoDate,
      });
    }
    window.open(bookUrl, '_blank');
  };

  const handleEventInfo = () => {
    const targetUrl = infoUrl || (slug ? `${window.location.origin}/events/${slug}/` : '#');
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'event_info_click',
        event_category: 'Event Info',
        event_label: title,
        event_date: isoDate,
      });
    }
    if (targetUrl !== '#') {
      window.open(targetUrl, '_blank');
    }
  };

  const buildUtmUrl = (baseUrl: string, eventTitle: string): string => {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('utm_source', 'boombastic_website');
      url.searchParams.set('utm_medium', 'event_share');
      url.searchParams.set('utm_campaign', eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'));
      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  const handleWhatsAppShare = () => {
    const shareUrl = slug ? `${window.location.origin}/events/${slug}/` : window.location.href;
    const message = `🎉 Check out this event: ${title}\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'whatsapp_share',
        event_category: 'Social Share',
        event_label: title,
        event_date: isoDate,
      });
    }
    
    window.open(whatsappUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const shareUrl = slug ? `${window.location.origin}/events/${slug}/` : window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'facebook_share',
        event_category: 'Social Share',
        event_label: title,
        event_date: isoDate,
      });
    }
    
    window.open(facebookUrl, '_blank');
  };

  const copyText = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = slug ? `${window.location.origin}/events/${slug}/` : window.location.href;
    const utmUrl = buildUtmUrl(shareUrl, title);
    
    try {
      await copyText(utmUrl);
      toast({
        description: "Link copied to clipboard!",
      });
      
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'copy_link',
          event_category: 'Social Share',
          event_label: title,
          event_date: isoDate,
        });
      }
    } catch (error) {
      toast({
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square overflow-hidden">
        <a href={eventUrl} aria-label={`Open event page: ${title}`}>
          <img
            src={poster}
            alt={`${title} event poster`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
            width="800"
            height="800"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </a>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
          {title}
        </h3>
        
        <div className="space-y-1 text-muted-foreground mb-4">
          <p className="text-sm">{date}</p>
          <p className="text-sm">{time}</p>
          <p className="text-sm">{venue}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleBookNow}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md font-medium"
          >
            Book Now
          </button>
          
          <button
            onClick={handleEventInfo}
            className="w-full border border-border bg-transparent hover:bg-muted hover:text-foreground transition-colors px-4 py-2 rounded-md font-medium text-muted-foreground"
          >
            Event Info
          </button>
          
          <a
            href={eventUrl}
            className="inline-flex items-center justify-center h-10 w-full px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground font-medium"
          >
            Event page
          </a>
        </div>

        <p className="text-xs text-muted-foreground mb-2 mt-4">Share this event</p>
        
        <div className="share-icons">
          <button 
            onClick={handleWhatsAppShare}
            className="icon-btn icon-whatsapp"
            title="Share on WhatsApp"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
            </svg>
          </button>
          
          <button 
            onClick={handleFacebookShare}
            className="icon-btn icon-facebook"
            title="Share on Facebook"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          
          <button 
            onClick={handleCopyLink}
            className="icon-btn icon-copy"
            title="Copy Link"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};