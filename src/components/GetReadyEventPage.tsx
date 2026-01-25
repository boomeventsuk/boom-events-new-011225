import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/get-ready/HeroSection';
import { DescriptionSection } from '@/components/get-ready/DescriptionSection';
import { SoundtrackSection } from '@/components/get-ready/SoundtrackSection';
import { HighlightsSection } from '@/components/get-ready/HighlightsSection';
import { TestimonialsSection } from '@/components/get-ready/TestimonialsSection';
import { FaqSection } from '@/components/get-ready/FaqSection';
import { CheckoutSection } from '@/components/2pm-club/CheckoutSection';
import { StickyBookButton } from '@/components/2pm-club/StickyBookButton';
import { trackEventPageView } from '@/lib/dataLayer';

export interface GetReadyEvent {
  slug: string;
  eventbriteId: string;
  promoCode?: string;
  isSoldOut?: boolean;
  title: string;
  location: string;
  city: string;
  start: string;
  end: string;
  bookUrl: string;
  image: string;
  description: string;
  fullDescription: string;
  highlights: string;
  soundtrack: string;
  hiddenSections?: string[];
  isAfternoon?: boolean;
}

interface GetReadyEventPageProps {
  event: GetReadyEvent;
}

const GetReadyEventPage = ({ event }: GetReadyEventPageProps) => {
  useEffect(() => {
    trackEventPageView(event.slug, event.title);
  }, [event.slug, event.title]);

  // Determine if this is an afternoon/daytime or evening event
  const startHour = new Date(event.start).getHours();
  const isAfternoon = event.isAfternoon ?? startHour < 18;

  const canonicalUrl = `https://boomevents.co.uk/event/${event.slug}/`;
  const pageTitle = `GET READY ${event.city} | 60s/70s Motown, Soul & Disco`;
  const timeOfDay = isAfternoon ? "afternoon" : "evening";
  const pageDescription = `${event.description} Book tickets for the ultimate 60s/70s ${timeOfDay} at ${event.location}.`;

  // Structured data for SEO
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    "name": event.title,
    "description": event.description,
    "image": event.image,
    "startDate": event.start,
    "endDate": event.end,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": event.location.split(',')[0],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.city,
        "addressCountry": "GB"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": "https://boomevents.co.uk"
    },
    "offers": {
      "@type": "Offer",
      "url": event.bookUrl,
      "availability": event.isSoldOut 
        ? "https://schema.org/SoldOut" 
        : "https://schema.org/InStock"
    }
  };

  const hiddenSections = event.hiddenSections || [];

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={event.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={event.image} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-card">
        <Header />
        
        <main>
          <HeroSection event={{
            slug: event.slug,
            title: event.title,
            location: event.location,
            start: event.start,
            end: event.end,
            image: event.image,
            city: event.city,
            isSoldOut: event.isSoldOut,
            isAfternoon: isAfternoon,
          }} />
          
          <DescriptionSection event={{
            city: event.city,
            fullDescription: event.fullDescription,
          }} />
          
          {!hiddenSections.includes('soundtrack') && (
            <SoundtrackSection soundtrack={event.soundtrack} />
          )}
          
          {!hiddenSections.includes('highlights') && (
            <HighlightsSection highlights={event.highlights} />
          )}
          
          {!hiddenSections.includes('testimonials') && (
            <TestimonialsSection />
          )}
          
          <CheckoutSection 
            event={{
              slug: event.slug,
              eventbriteId: event.eventbriteId,
              title: event.title,
              promoCode: event.promoCode,
              isSoldOut: event.isSoldOut,
            }}
            checkoutMessage={isAfternoon 
              ? "🔥 Only 50 tickets left — £7.50 each — This Sunday 2pm-6pm!"
              : "🔥 Tickets from just £7 — Friday 8pm-Midnight!"
            }
          />
          
          {!hiddenSections.includes('faq') && (
            <FaqSection isAfternoon={isAfternoon} />
          )}
        </main>
        
        <Footer />
        
        <StickyBookButton eventSlug={event.slug} />
      </div>
    </>
  );
};

export default GetReadyEventPage;
