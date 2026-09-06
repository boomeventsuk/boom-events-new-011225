import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { trackEventPageView } from '@/lib/dataLayer';
import { formatHouseDate } from '@/lib/eventUtils';
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
import TrustStrip from '@/components/TrustStrip';
import { isTwoPmEightiesEdition, normaliseTwoPmEditionEvent } from '@/lib/twoPmEdition';
import { formatPriceLabel, buildFeedUrgency } from '@/lib/eventUtils';
import type { GroupTicket } from '@/components/EventCard';

export interface TwoPmClubEvent {
  slug: string;
  eventType: string;
  cityCode: string;
  eventbriteId: string;
  promoCode?: string;
  isSoldOut?: boolean;
  waitingListUrl?: string;
  colorScheme?: string;
  fomoOverride?: {
    tier: string;
    message: string;
    timeMessage?: string | null;
  };
  statusLabel?: string;
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
  timeDisplay?: string;
  priceLabel?: string;
  groupTicket?: GroupTicket | null;
}

// Extract the numeric value from a feed price label: "From £8.50" -> "8.50".
const priceFromLabel = (label?: string): string | undefined => {
  const m = label?.match(/(\d+(?:\.\d{2})?)/);
  return m ? m[1] : undefined;
};

interface TwoPmClubEventPageProps {
  event: TwoPmClubEvent;
}

const TwoPmClubEventPage = ({ event }: TwoPmClubEventPageProps) => {
  const displayEvent = normaliseTwoPmEditionEvent(event);
  const isEightiesEdition = isTwoPmEightiesEdition(displayEvent);
  // Canonical form: lowercase, trailing slash. Matches the prerendered
  // static shell; the uppercase no-slash form 301s, never emit it.
  const canonicalUrl = `https://www.boomevents.co.uk/event/${displayEvent.slug.toLowerCase()}/`;
  const dateLabel = formatHouseDate(displayEvent.start);
  const pageTitle = [displayEvent.title, dateLabel, 'Boombastic Events'].filter(Boolean).join(' | ');
  
  const isChristmasEvent = displayEvent.title.toLowerCase().includes('christmas');
  // Booking urgency / pricing from the live feed only.
  const feedUrgency = buildFeedUrgency(displayEvent);
  
  useEffect(() => {
    // Track page view on mount
    trackEventPageView(displayEvent.slug, displayEvent.title, {
      eventbriteId: displayEvent.eventbriteId,
      city: displayEvent.location.split(',')[1]?.trim(),
      venue: displayEvent.location.split(',')[0]?.trim(),
      startIso: displayEvent.start,
      status: displayEvent.isSoldOut ? 'sold-out' : undefined,
      source: 'event_page'
    });
  }, [
    displayEvent.slug,
    displayEvent.title,
    displayEvent.eventbriteId,
    displayEvent.location,
    displayEvent.start,
    displayEvent.isSoldOut,
  ]);

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": displayEvent.title,
    "startDate": displayEvent.start,
    "endDate": displayEvent.end,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": displayEvent.location.split(',')[0]?.trim(),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": displayEvent.location.split(',')[1]?.trim(),
        "addressCountry": "GB"
      }
    },
    "image": displayEvent.image,
    "description": displayEvent.description,
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": "https://www.boomevents.co.uk"
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "GBP",
      // Lowest ticket price from the live feed (omit when not synced).
      ...(priceFromLabel(displayEvent.priceLabel)
        ? { "price": priceFromLabel(displayEvent.priceLabel) }
        : {}),
      "availability": displayEvent.isSoldOut
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={displayEvent.description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="event" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={displayEvent.description} />
        <meta property="og:image" content={displayEvent.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Boombastic Events" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={displayEvent.description} />
        <meta name="twitter:image" content={displayEvent.image} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className={`min-h-screen bg-background ${displayEvent.colorScheme ? `theme-${displayEvent.colorScheme}` : ''}`}>
        <Header />
        
        <main>
          <HeroSection event={displayEvent} />
          <DescriptionSection event={displayEvent} />
          <VideoSection isChristmas={isChristmasEvent} />
          <HighlightsSection highlights={displayEvent.highlights} isChristmas={isChristmasEvent} />
          <PhotoGallery />
          <TestimonialsSection />
          <TrustStrip />
          <CheckoutSection event={displayEvent} checkoutMessage={feedUrgency} />
          <FaqSection isEightiesEdition={isEightiesEdition} isBradlaugh={displayEvent.location.includes('Charles Bradlaugh')} />
        </main>

        <Footer />
        
        <StickyBookButton
          eventSlug={displayEvent.slug}
          eventTitle={displayEvent.title}
          eventbriteId={displayEvent.eventbriteId}
          urgencyText={displayEvent.fomoOverride?.message}
          statusLabel={displayEvent.statusLabel}
          start={displayEvent.start}
          venue={displayEvent.location.split(',')[0]?.trim()}
        />
      </div>
    </>
  );
};

export default TwoPmClubEventPage;
