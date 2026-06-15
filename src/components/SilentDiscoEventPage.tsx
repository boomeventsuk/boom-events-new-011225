import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { trackEventPageView } from '@/lib/dataLayer';
import { formatHouseDate, buildFeedUrgency, stripEmoji } from '@/lib/eventUtils';
import type { GroupTicket } from '@/components/EventCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/silent-disco/HeroSection';
import { DescriptionSection } from '@/components/silent-disco/DescriptionSection';
import { ChannelsSection } from '@/components/silent-disco/ChannelsSection';
import { HighlightsSection } from '@/components/2pm-club/HighlightsSection';
import { CheckoutSection } from '@/components/2pm-club/CheckoutSection';
import { StickyBookButton } from '@/components/2pm-club/StickyBookButton';
import TrustStrip from '@/components/TrustStrip';

export interface SilentDiscoChannel {
  color: 'blue' | 'green' | 'red';
  emoji?: string;
  name: string;
  artists: string;
  description?: string;
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
  timeDisplay?: string;
  priceLabel?: string;
  groupTicket?: GroupTicket | null;
  statusLabel?: string;
}

interface SilentDiscoEventPageProps {
  event: SilentDiscoEvent;
}

const SilentDiscoEventPage = ({ event }: SilentDiscoEventPageProps) => {
  // Canonical form: lowercase, trailing slash. Matches the prerendered
  // static shell; the uppercase no-slash form 301s, never emit it.
  const canonicalUrl = `https://www.boomevents.co.uk/event/${event.slug.toLowerCase()}/`;
  const dateLabel = formatHouseDate(event.start);
  // Keep the date in the hydrated title so Helmet matches the static shell
  const pageTitle = [event.title, dateLabel, 'Boombastic Events'].filter(Boolean).join(' | ');
  const hiddenSections = event.hiddenSections || [];
  // Booking urgency / pricing from the live feed only.
  const feedUrgency = buildFeedUrgency(event);
  // The feed description carries emoji bullets; strip them for meta + JSON-LD.
  const metaDescription = stripEmoji(event.description);
  
  useEffect(() => {
    trackEventPageView(event.slug, event.title, {
      eventbriteId: event.eventbriteId,
      city: event.location.split(',')[1]?.trim(),
      venue: event.location.split(',')[0]?.trim(),
      startIso: event.start,
      status: event.isSoldOut ? 'sold-out' : undefined,
      source: 'event_page'
    });
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
    "description": metaDescription,
    "organizer": {
      "@type": "Organization",
      "name": "Boombastic Events",
      "url": "https://boomevents.co.uk"
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "GBP",
      "availability": event.isSoldOut
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="event" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Boombastic Events" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
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
          <TrustStrip />
          <CheckoutSection
            event={event}
            checkoutMessage={feedUrgency || "10 years of sell-out parties. Don't miss out!"}
          />
        </main>

        <Footer />

        <StickyBookButton eventSlug={event.slug} eventTitle={event.title} eventbriteId={event.eventbriteId} statusLabel={event.statusLabel} start={event.start} venue={event.location.split(',')[0]?.trim()} />
      </div>
    </>
  );
};

export default SilentDiscoEventPage;
