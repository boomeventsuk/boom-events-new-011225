import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/boombastic-90s/HeroSection';
import { DescriptionSection } from '@/components/boombastic-90s/DescriptionSection';
import { SoundtrackSection } from '@/components/boombastic-90s/SoundtrackSection';
import { HighlightsSection } from '@/components/boombastic-90s/HighlightsSection';
import { TestimonialsSection } from '@/components/boombastic-90s/TestimonialsSection';
import { FaqSection } from '@/components/boombastic-90s/FaqSection';
import { CheckoutSection } from '@/components/2pm-club/CheckoutSection';
import { StickyBookButton } from '@/components/2pm-club/StickyBookButton';
import TrustStrip from '@/components/TrustStrip';
import { trackEventPageView } from '@/lib/dataLayer';
import { formatHouseDate, buildFeedUrgency } from '@/lib/eventUtils';
import type { GroupTicket } from '@/components/EventCard';

export interface Boombastic90sEvent {
  slug: string;
  eventbriteId: string;
  promoCode?: string;
  isSoldOut?: boolean;
  title: string;
  subtitle?: string;
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
  timeDisplay?: string;
  priceLabel?: string;
  groupTicket?: GroupTicket | null;
  statusLabel?: string;
}

interface Boombastic90sEventPageProps {
  event: Boombastic90sEvent;
}

const Boombastic90sEventPage = ({ event }: Boombastic90sEventPageProps) => {
  useEffect(() => {
    trackEventPageView(event.slug, event.title, {
      eventbriteId: event.eventbriteId,
      city: event.city,
      venue: event.location.split(',')[0]?.trim(),
      startIso: event.start,
      status: event.isSoldOut ? 'sold-out' : undefined,
      source: 'event_page'
    });
  }, [event.slug, event.title]);

  // Canonical form: lowercase, trailing slash. Matches the prerendered
  // static shell; the uppercase no-slash form 301s, never emit it.
  const canonicalUrl = `https://www.boomevents.co.uk/event/${event.slug.toLowerCase()}/`;
  const dateLabel = formatHouseDate(event.start);
  // Keep the date in the hydrated title so Helmet matches the static shell
  const pageTitle = [event.title, dateLabel, 'Boombastic Events'].filter(Boolean).join(' | ');
  const pageDescription = `${event.description} Book tickets for the ultimate 90s night at ${event.location}.`;
  // Booking urgency / pricing from the live feed only.
  const feedUrgency = buildFeedUrgency(event);

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
      "url": canonicalUrl,
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
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={event.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={event.image} />
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-card">
        <Header />
        
        <main>
          <HeroSection event={{
            slug: event.slug,
            eventbriteId: event.eventbriteId,
            title: event.title,
            subtitle: event.subtitle || event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            image: event.image,
            city: event.city,
            isSoldOut: event.isSoldOut,
            timeDisplay: event.timeDisplay,
            priceLabel: event.priceLabel,
            groupTicket: event.groupTicket,
            statusLabel: event.statusLabel,
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
          
          <TrustStrip />
          <CheckoutSection
            event={{
              slug: event.slug,
              eventbriteId: event.eventbriteId,
              title: event.title,
              promoCode: event.promoCode,
              isSoldOut: event.isSoldOut,
            }}
            checkoutMessage={feedUrgency || "Get your group together. Book now. This is your night."}
          />

          {!hiddenSections.includes('faq') && (
            <FaqSection />
          )}
        </main>

        <Footer />

        <StickyBookButton eventSlug={event.slug} eventTitle={event.title} eventbriteId={event.eventbriteId} statusLabel={event.statusLabel} start={event.start} venue={event.location.split(',')[0]?.trim()} />
      </div>
    </>
  );
};

export default Boombastic90sEventPage;
