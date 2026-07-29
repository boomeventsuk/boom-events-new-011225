import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HeroSection } from '@/components/family-silent-disco/HeroSection';
import { DescriptionSection } from '@/components/family-silent-disco/DescriptionSection';
import { ChannelsSection } from '@/components/silent-disco/ChannelsSection';
import { HighlightsSection } from '@/components/2pm-club/HighlightsSection';
import { CheckoutSection } from '@/components/2pm-club/CheckoutSection';
import { FaqSection } from '@/components/family-silent-disco/FaqSection';
import { StickyBookButton } from '@/components/2pm-club/StickyBookButton';
import TrustStrip from '@/components/TrustStrip';
import { trackEventPageView } from '@/lib/dataLayer';
import { formatHouseDate, buildFeedUrgency, stripEmoji } from '@/lib/eventUtils';
import { SilentDiscoChannel } from '@/components/SilentDiscoEventPage';
import type { GroupTicket } from '@/components/EventCard';

export interface FamilySilentDiscoEvent {
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
  doorsTime?: string;
  experienceStartTime?: string;
  bookUrl?: string;
  image: string;
  description: string;
  fullDescription: string;
  highlights: string;
  channels: SilentDiscoChannel[];
  hiddenSections?: string[];
  timeDisplay?: string;
  priceLabel?: string;
  groupTicket?: GroupTicket | null;
  statusLabel?: string;
}

interface FamilySilentDiscoEventPageProps {
  event: FamilySilentDiscoEvent;
}

const FamilySilentDiscoEventPage = ({ event }: FamilySilentDiscoEventPageProps) => {
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

  const dateLabel = formatHouseDate(event.start);
  // Keep the date in the hydrated title so Helmet matches the static shell
  const pageTitle = [event.title, dateLabel, 'Boombastic Events'].filter(Boolean).join(' | ');
  // Feed copy may carry emoji; strip for meta + JSON-LD.
  const pageDescription = stripEmoji(event.description);
  // Booking urgency / pricing from the live feed only.
  const feedUrgency = buildFeedUrgency(event);
  // Canonical form: lowercase, trailing slash. Matches the prerendered
  // static shell; the uppercase no-slash form 301s, never emit it.
  const canonicalUrl = `https://www.boomevents.co.uk/event/${event.slug.toLowerCase()}/`;

  // Schema.org Event structured data
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'ChildrensEvent',
    name: event.title,
    description: pageDescription,
    image: event.image,
    startDate: event.start,
    endDate: event.end,
    eventStatus: event.isSoldOut ? 'https://schema.org/EventPostponed' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city,
        addressCountry: 'GB',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Boombastic Events',
      url: 'https://boomevents.co.uk',
    },
    performer: {
      '@type': 'PerformingGroup',
      name: 'Silent Disco DJs',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      availability: event.isSoldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      priceCurrency: 'GBP',
    },
    typicalAgeRange: '4+',
    audience: {
      '@type': 'Audience',
      audienceType: 'Families with children',
    },
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
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main>
          <HeroSection
            event={{
              slug: event.slug,
              eventbriteId: event.eventbriteId,
              title: event.title,
              subtitle: event.subtitle || 'Dance together, find your vibe!',
              location: event.location,
              start: event.start,
              end: event.end,
              doorsTime: event.doorsTime,
              experienceStartTime: event.experienceStartTime,
              image: event.image,
              isSoldOut: event.isSoldOut,
              timeDisplay: event.timeDisplay,
              priceLabel: event.priceLabel,
              groupTicket: event.groupTicket,
              statusLabel: event.statusLabel,
            }}
          />

          <DescriptionSection fullDescription={event.fullDescription} />

          <ChannelsSection channels={event.channels} />

          <HighlightsSection
            highlights={event.highlights}
            sectionTitle="Why Parents Love Family Silent Disco"
          />

          <TrustStrip />
          <CheckoutSection
            event={{
              slug: event.slug,
              eventbriteId: event.eventbriteId,
              title: event.title,
              promoCode: event.promoCode,
              isSoldOut: event.isSoldOut,
            }}
            checkoutMessage={feedUrgency}
          />

          {!hiddenSections.includes('faq') && <FaqSection />}
        </main>

        <Footer />

        <StickyBookButton eventSlug={event.slug} eventTitle={event.title} eventbriteId={event.eventbriteId} statusLabel={event.statusLabel} start={event.start} venue={event.location.split(',')[0]?.trim()} />
      </div>
    </>
  );
};

export default FamilySilentDiscoEventPage;
