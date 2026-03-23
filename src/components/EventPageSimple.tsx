import { Calendar, Clock, MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventbriteEmbed from '@/components/EventbriteEmbed';

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

interface EventPageSimpleProps {
  event: EventData;
}

const EventPageSimple = ({ event }: EventPageSimpleProps) => {
  const scrollToCheckout = () => {
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) {
      checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  const shareUrl = `https://boomevents.co.uk/event/${event.eventCode}`;
  const whatsappText = encodeURIComponent(`Check out ${event.title} at ${shareUrl}`);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  
  // Split description by newlines for paragraph rendering
  const descriptionParagraphs = event.description.split('\n\n').filter(p => p.trim());

  // Helper to render styled lines based on pattern detection
  const renderStyledLine = (line: string, isFirstParagraph: boolean) => {
    const trimmedLine = line.trim();
    
    // Section headers (🎧, 🎟)
    if (trimmedLine.startsWith('🎧') || trimmedLine.startsWith('🎟')) {
      return (
        <h3 className="text-lg md:text-xl font-bold text-foreground mt-4 mb-2">
          {trimmedLine}
        </h3>
      );
    }
    
    // Bullet info cards (▪️)
    if (trimmedLine.startsWith('▪️')) {
      return (
        <div className="bg-muted/50 border-l-4 border-primary/50 rounded-lg p-3 my-2">
          <p className="text-base md:text-lg font-medium text-foreground">{trimmedLine}</p>
        </div>
      );
    }
    
    // Feature lines (🎶)
    if (trimmedLine.startsWith('🎶')) {
      return (
        <p className="text-base md:text-lg font-semibold text-primary my-2">{trimmedLine}</p>
      );
    }
    
    // Sub-headers (🎄)
    if (trimmedLine.startsWith('🎄')) {
      return (
        <h4 className="text-base md:text-lg font-bold text-foreground mt-3 mb-1">{trimmedLine}</h4>
      );
    }
    
    // Competition highlight (🏆)
    if (trimmedLine.startsWith('🏆')) {
      return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 my-2">
          <p className="text-base md:text-lg font-semibold text-foreground">{trimmedLine}</p>
        </div>
      );
    }
    
    // Channel cards with colored backgrounds
    if (trimmedLine.startsWith('🔴')) {
      return (
        <div className="bg-red-500/10 border-l-4 border-red-500 rounded-lg p-3 my-2">
          <p className="text-base md:text-lg font-medium text-foreground">{trimmedLine}</p>
        </div>
      );
    }
    if (trimmedLine.startsWith('🔵')) {
      return (
        <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-3 my-2">
          <p className="text-base md:text-lg font-medium text-foreground">{trimmedLine}</p>
        </div>
      );
    }
    if (trimmedLine.startsWith('🟢')) {
      return (
        <div className="bg-green-500/10 border-l-4 border-green-500 rounded-lg p-3 my-2">
          <p className="text-base md:text-lg font-medium text-foreground">{trimmedLine}</p>
        </div>
      );
    }
    
    // Parenthetical notes - smaller, muted
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      return (
        <p className="text-sm text-foreground/60 italic my-2">{trimmedLine}</p>
      );
    }
    
    // Feature headlines (contains numbers + "DJs" or "hours")
    if (/\d+\s*(DJs?|hours?)/i.test(trimmedLine)) {
      return (
        <p className="text-lg md:text-xl font-bold text-foreground my-2">{trimmedLine}</p>
      );
    }
    
    // First paragraph - larger and slightly bolder
    if (isFirstParagraph) {
      return (
        <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">{trimmedLine}</p>
      );
    }
    
    // Default text
    return <p className="text-base md:text-lg text-foreground/85">{trimmedLine}</p>;
  };

  const canonicalUrl = `https://boomevents.co.uk/event/${event.eventCode}`;
  const metaDescription = event.description.split('\n')[0].slice(0, 160);

  return (
    <>
      <Helmet>
        <title>{event.title} | Boombastic Events</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Boombastic Events" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={event.image} />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
      
      {/* Hero Section */}
      <section className="pt-32 md:pt-36 pb-8 bg-gradient-to-b from-background via-background to-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 items-stretch">
            
            {/* Left: Poster Image */}
            <div className="flex justify-center md:justify-start">
              <img 
                src={event.image}
                alt={event.title}
                className="w-full max-w-md rounded-xl shadow-2xl shadow-primary/20"
                width="400"
                height="400"
              />
            </div>
            
            {/* Right: Details Card */}
            <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-4 md:p-6 space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {event.title}
              </h1>
              
              {event.subtitle && (
                <p className="text-sm md:text-base text-foreground/70">
                  {event.subtitle}
                </p>
              )}
              
              {/* Date/Time/Venue rows with icons */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/85">{event.date}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/85">{event.timeDisplay}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-base text-foreground/85">{event.venue}, {event.city}</span>
                </div>
              </div>
              
              {/* Book Tickets Button */}
              <Button 
                onClick={scrollToCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-6"
              >
                {event.isSoldOut ? 'Join Waiting List' : 'Book Tickets'}
              </Button>
              
              {/* Share Icons */}
              <div className="flex gap-3 pt-2">
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg py-2.5 px-4 transition-colors"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-sm font-medium">Share</span>
                </a>
                
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg py-2.5 px-4 transition-colors"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm font-medium">Share</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Description Section */}
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card/50 border border-border/30 rounded-2xl p-6 md:p-8 space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                About This Event
              </h2>
              <div className="space-y-3">
                {descriptionParagraphs.map((paragraph, paragraphIndex) => {
                  const lines = paragraph.split('\n').filter(l => l.trim());
                  const isFirstParagraph = paragraphIndex === 0;
                  
                  return (
                    <div key={paragraphIndex} className="space-y-2">
                      {lines.map((line, lineIndex) => (
                        <div key={lineIndex}>
                          {renderStyledLine(line, isFirstParagraph && lineIndex === 0)}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Embedded Checkout Section */}
      <section id="checkout-section" className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-3">
                  🎟️
                </div>
                <h2 className="font-poppins text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  {event.isSoldOut ? 'Join the Waiting List' : 'Book Your Tickets'}
                </h2>
                {event.isSoldOut && (
                  <p className="text-foreground/70 mt-2">This event has sold out! Join the waiting list below.</p>
                )}
              </div>
              
              <div className="bg-card/50 rounded-xl overflow-hidden">
                <EventbriteEmbed
                  eventbriteId={event.eventbriteId}
                  containerId={`eventbrite-${event.eventCode}`}
                  height={425}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default EventPageSimple;
