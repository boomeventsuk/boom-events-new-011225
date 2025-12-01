import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { trackEventPageView } from '@/lib/dataLayer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/2pm-club/HeroSection';
import { DescriptionSection } from '@/components/2pm-club/DescriptionSection';
import { VideoSection } from '@/components/2pm-club/VideoSection';
import { HighlightsSection } from '@/components/2pm-club/HighlightsSection';
import { PhotoGallery } from '@/components/2pm-club/PhotoGallery';
import { TestimonialsSection } from '@/components/2pm-club/TestimonialsSection';
import { CheckoutSection } from '@/components/2pm-club/CheckoutSection';
import { FaqSection } from '@/components/2pm-club/FaqSection';
import { StickyBookButton } from '@/components/2pm-club/StickyBookButton';

export interface TwoPmClubEvent {
  slug: string;
  eventType: string;
  cityCode: string;
  eventbriteId: string;
  promoCode?: string;
  title: string;
  location: string;
  start: string;
  end: string;
  bookUrl: string;
  infoUrl: string;
  image: string;
  description: string;
  subtitle: string;
  fullDescription: string;
  highlights: string;
}

interface TwoPmClubEventPageProps {
  event: TwoPmClubEvent;
}

const TwoPmClubEventPage = ({ event }: TwoPmClubEventPageProps) => {
  const canonicalUrl = `https://boomevents.co.uk/events/${event.slug}/`;
  
  // Determine if this is a Christmas event (December events ending in "1225")
  const isChristmasEvent = event.slug.includes('1225');
  
  useEffect(() => {
    // Track page view on mount
    trackEventPageView(event.slug, event.title);
  }, [event.slug, event.title]);

  // JSON-LD structured data
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
        
        {/* Open Graph */}
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description} />
        <meta property="og:image" content={event.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Boombastic Events" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description} />
        <meta name="twitter:image" content={event.image} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main>
          <HeroSection event={event} />
          <DescriptionSection event={event} />
          <VideoSection isChristmas={isChristmasEvent} />
          <HighlightsSection highlights={event.highlights} isChristmas={isChristmasEvent} />
          <PhotoGallery />
          <TestimonialsSection />
          <CheckoutSection event={event} />
          <FaqSection />
        </main>

        <Footer />
        
        <StickyBookButton eventSlug={event.slug} />
      </div>
    </>
  );
};

export default TwoPmClubEventPage;
