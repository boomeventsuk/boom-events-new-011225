import { Calendar, Clock, MapPin, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackBookClick, trackShare } from '@/lib/dataLayer';
import { format } from 'date-fns';

interface HeroSectionProps {
  event: {
    slug: string;
    title: string;
    location: string;
    start: string;
    end: string;
    image: string;
    cityCode: string;
    isSoldOut?: boolean;
  };
}

export const HeroSection = ({ event }: HeroSectionProps) => {
  const isChristmas = event.title.toLowerCase().includes('christmas');
  const city = event.location.split(',')[1]?.trim() || event.cityCode;
  const venue = event.location.split(',')[0]?.trim();
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  const shareUrl = `https://boomevents.co.uk/events/${event.slug}/`;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const handleBookClick = () => {
    trackBookClick(event.slug);
    const checkoutSection = document.getElementById('checkout-section');
    checkoutSection?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleShare = (platform: 'WhatsApp' | 'Facebook' | 'Messenger') => {
    trackShare(platform, event.title);
    
    const text = `Check out ${event.title}!`;
    let url = '';
    
    if (platform === 'WhatsApp') {
      url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
    } else if (platform === 'Facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'Messenger') {
      url = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <section className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT: Event Poster */}
          <div className="flex justify-center lg:justify-end">
            <img
              src={event.image}
              alt={event.title}
              width="400"
              height="400"
              className="w-full max-w-md rounded-xl shadow-2xl shadow-primary/20"
            />
          </div>

          {/* RIGHT: Event Details */}
          <div className="space-y-6">
            <div>
              {isChristmas ? (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">
                    THE 2PM CLUB Christmas
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                    Daytime Disco {city}
                  </h2>
                  <p className="text-sm md:text-base text-foreground/80">
                    Iconic 80s 90s 00s Anthems plus Festive Classics
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">
                    THE 2PM CLUB
                  </h1>
                  <p className="text-lg md:text-xl text-foreground">
                    Daytime Disco {city.toUpperCase()}
                  </p>
                  <p className="text-lg md:text-xl text-foreground">
                    Iconic 80s 90s 00s Anthems
                  </p>
                </>
              )}
            </div>

            <div className="space-y-3 text-base">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span>2pm – 6pm</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{venue}, {city}</span>
              </div>
            </div>

            <Button
              id="hero-book-button"
              size="lg"
              className="w-full md:w-auto text-lg px-8 py-6"
              onClick={handleBookClick}
            >
              {event.isSoldOut ? 'JOIN WAITING LIST' : 'BOOK TICKETS'}
            </Button>

            <div className="pt-4 border-t border-border/30">
              <p className="text-sm text-foreground/70 mb-3">
                Be the group chat hero — Share this event
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare('WhatsApp')}
                  className="icon-btn icon-whatsapp"
                  aria-label="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => handleShare(isMobile ? 'Messenger' : 'Facebook')}
                  className="icon-btn icon-facebook"
                  aria-label={isMobile ? 'Share on Messenger' : 'Share on Facebook'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    {isMobile ? (
                      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.898 1.446 5.486 3.708 7.185V22l3.517-1.93c.938.259 1.932.4 2.775.4 5.523 0 10-4.145 10-9.243C22 6.145 17.523 2 12 2zm.993 12.454l-2.562-2.734-5 2.734 5.5-5.839 2.625 2.734 4.937-2.734-5.5 5.839z"/>
                    ) : (
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
