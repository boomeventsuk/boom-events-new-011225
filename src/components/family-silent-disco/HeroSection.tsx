import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackBookClick, trackShare } from '@/lib/dataLayer';
import { useEventFomoData } from '@/hooks/useEventFomoData';
import FomoBadge from '@/components/FomoBadge';

interface HeroSectionProps {
  event: {
    slug: string;
    title: string;
    subtitle?: string;
    location: string;
    start: string;
    end: string;
    doorsTime?: string;
    image: string;
    isSoldOut?: boolean;
  };
}

export const HeroSection = ({ event }: HeroSectionProps) => {
  const { data: fomoData } = useEventFomoData(event.slug);
  
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  const formattedDate = startDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  const startTime = startDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const endTime = endDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleBookClick = () => {
    trackBookClick(event.slug);
    const checkoutSection = document.getElementById('checkout-section');
    checkoutSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShare = (platform: 'WhatsApp' | 'Facebook' | 'Messenger') => {
    trackShare(platform, event.title);
    const eventUrl = `https://boomevents.co.uk/event/${event.slug.toUpperCase()}`;
    const text = `🎧 Family Silent Disco! ${event.title} - ${formattedDate}. Dance together, find your vibe!`;
    
    const urls = {
      WhatsApp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + eventUrl)}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
      Messenger: `fb-messenger://share?link=${encodeURIComponent(eventUrl)}`,
    };
    
    window.open(urls[platform], '_blank');
  };

  return (
    <section className="relative py-10 md:py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Event Image - LEFT on desktop */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 max-w-md w-full">
              <img
                src={event.image}
                alt={event.title}
                className="w-full aspect-square object-cover"
                loading="eager"
              />
              {/* Family Fun Badge */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-500 text-white border-0 text-sm px-3 py-1 shadow-lg">
                  👨‍👩‍👧‍👦 FAMILY FUN
                </Badge>
              </div>
              {/* FOMO Badge */}
              {fomoData && fomoData.fomo_tier && fomoData.fomo_message && (
                <div className="absolute top-4 right-4">
                  <FomoBadge 
                    tier={fomoData.fomo_tier} 
                    message={fomoData.fomo_message}
                    timeMessage={fomoData.time_message}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Event Details - RIGHT on desktop */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
              {event.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-primary font-medium mb-6">
              {event.subtitle || 'Dance together, find your vibe!'}
            </p>

            {/* Date & Time */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center lg:justify-start gap-3 text-lg">
                <span className="text-2xl">📅</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start gap-3 text-lg">
                <span className="text-2xl">🕐</span>
                <span>
                  {event.doorsTime && (
                    <span className="text-foreground/70">Doors {event.doorsTime} · </span>
                  )}
                  <span className="font-medium">Full Experience {startTime} – {endTime}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start gap-3 text-lg">
                <span className="text-2xl">📍</span>
                <span>{event.location}</span>
              </div>
            </div>

            {/* Pricing Highlight */}
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 inline-block">
              <p className="text-lg font-bold text-primary">
                🎟️ FAMILY OF 4 FROM £30!
              </p>
              <p className="text-sm text-foreground/70">Adult £10 · Child £8 (+booking fee)</p>
            </div>

            {/* Book Button */}
            <div className="mb-6">
              <Button
                id="hero-book-button"
                onClick={handleBookClick}
                size="lg"
                className="text-lg px-8 py-6 shadow-lg shadow-primary/30"
              >
                {event.isSoldOut ? 'Join Waiting List' : 'Book Family Tickets'}
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <span className="text-sm text-foreground/60">Share:</span>
              <button
                onClick={() => handleShare('WhatsApp')}
                className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 transition-colors"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('Facebook')}
                className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                aria-label="Share on Facebook"
              >
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
