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
import { trackEventPageView } from '@/lib/dataLayer';
import { SilentDiscoChannel } from '@/components/SilentDiscoEventPage';

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
  bookUrl?: string;
  image: string;
  description: string;
  fullDescription: string;
  highlights: string;
  channels: SilentDiscoChannel[];
  hiddenSections?: string[];
}

interface FamilySilentDiscoEventPageProps {
  event: FamilySilentDiscoEvent;
}

const FamilySilentDiscoEventPage = ({ event }: FamilySilentDiscoEventPageProps) => {
  useEffect(() => {
    trackEventPageView(event.slug, event.title);
  }, [event.slug, event.title]);

  const startDate = new Date(event.start);
  const formattedDate = startDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const pageTitle = `${event.title} | ${formattedDate} | Family Silent Disco`;
  const pageDescription = event.description;
  const canonicalUrl = `https://boomevents.co.uk/event/${event.slug.toUpperCase()}`;

  // Schema.org Event structured data
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'ChildrensEvent',
    name: event.title,
    description: event.description,
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
      url: event.bookUrl || `https://www.eventbrite.co.uk/e/${event.eventbriteId}`,
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
              title: event.title,
              subtitle: event.subtitle || 'Dance together, find your vibe!',
              location: event.location,
              start: event.start,
              end: event.end,
              doorsTime: event.doorsTime,
              image: event.image,
              isSoldOut: event.isSoldOut,
            }}
          />
          
          <DescriptionSection fullDescription={event.fullDescription} />
          
          <ChannelsSection channels={event.channels} />
          
          {!hiddenSections.includes('highlights') && event.highlights && (
            <HighlightsSection
              highlights={event.highlights}
              sectionTitle="Why Families Love It"
            />
          )}
          
          <CheckoutSection
            event={{
              slug: event.slug,
              eventbriteId: event.eventbriteId,
              title: event.title,
              promoCode: event.promoCode,
              isSoldOut: event.isSoldOut,
            }}
            checkoutMessage="Family of 4 from £30! Grab your headphones before they're gone."
          />
          
          {!hiddenSections.includes('faq') && <FaqSection />}
        </main>
        
        <Footer />
        
        <StickyBookButton eventSlug={event.slug} />
      </div>
    </>
  );
};

export default FamilySilentDiscoEventPage;
