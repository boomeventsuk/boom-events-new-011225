import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { trackEventPageView } from '@/lib/dataLayer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/silent-disco/HeroSection';
import { DescriptionSection } from '@/components/silent-disco/DescriptionSection';
import { ChannelsSection } from '@/components/silent-disco/ChannelsSection';
import { HighlightsSection } from '@/components/2pm-club/HighlightsSection';
import { CheckoutSection } from '@/components/2pm-club/CheckoutSection';
import { StickyBookButton } from '@/components/2pm-club/StickyBookButton';

export interface SilentDiscoChannel {
  color: 'blue' | 'green' | 'red';
  emoji?: string;
  name: string;
  artists: string;
}

export interface SilentDiscoEvent {
  slug: string;
  eventbriteId: string;
  promoCode?: string;
  isSoldOut?: boolean;
  title: string;
  location: string;
  start: string;
  end: string;
  bookUrl: string;
  image: string;
  description: string;
  subtitle: string;
  fullDescription: string;
  highlights: string;
  channels: SilentDiscoChannel[];
  hiddenSections?: string[];
}

interface SilentDiscoEventPageProps {
  event: SilentDiscoEvent;
}

const SilentDiscoEventPage = ({ event }: SilentDiscoEventPageProps) => {
  const canonicalUrl = `https://boomevents.co.uk/event/${event.slug}`;
  const hiddenSections = event.hiddenSections || [];
  
  useEffect(() => {
    trackEventPageView(event.slug, event.title);
  }, [event.slug, event.title]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.start,
    "endDate": event.end,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": event.location.split(',')[0]?.trim(),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.location.split(',')[1]?.trim(),
        "addressCountry": "GB"
      }
    },
    "image": event.image,
    "description": event.description,
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": "https://boomevents.co.uk"
    },
    "offers": {
      "@type": "Offer",
      "url": event.bookUrl,
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    }
  };

  return (
    <>
      <Helmet>
        <title>{event.title} | Boombastic Events</title>
        <meta name="description" content={event.description} />
        <link rel="canonical" href={canonicalUrl} />
        
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description} />
        <meta property="og:image" content={event.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Boombastic Events" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description} />
        <meta name="twitter:image" content={event.image} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main>
          <HeroSection event={event} />
          <DescriptionSection event={event} />
          <ChannelsSection channels={event.channels} />
          {!hiddenSections.includes('highlights') && (
            <HighlightsSection 
              highlights={event.highlights} 
              sectionTitle="Why People Love Our Silent Discos"
            />
          )}
          <CheckoutSection 
            event={event} 
            checkoutMessage="10 years of sell-out parties. Don't miss out!"
          />
        </main>

        <Footer />
        
        <StickyBookButton eventSlug={event.slug} />
      </div>
    </>
  );
};

export default SilentDiscoEventPage;
