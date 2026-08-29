import { Ticket } from 'lucide-react';
import EventbriteEmbed from '@/components/EventbriteEmbed';

interface CheckoutSectionProps {
  event: {
    slug: string;
    eventbriteId: string;
    title: string;
    promoCode?: string;
    isSoldOut?: boolean;
  };
  checkoutMessage?: string;
}

export const CheckoutSection = ({ event, checkoutMessage }: CheckoutSectionProps) => {
  const defaultMessage = "Grab your tickets before they go.";
  const isPreSale = /tickets on sale friday/i.test(checkoutMessage || '');
  const showEventbriteTrustStrip = event.slug.toUpperCase() === '120926-B90-NPTON';

  return (
    <section id="checkout-section" className="py-10 md:py-14 bg-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card/50 border border-primary/30 rounded-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {event.isSoldOut ? "Join the Waiting List" : isPreSale ? "Tickets on sale Friday at 12 noon" : "Book Your Tickets"}
            </h2>
            <p className="text-lg text-foreground/70">
              {event.isSoldOut
                ? "This event has sold out! Join the waiting list via Eventbrite below"
                : isPreSale
                  ? "Tickets will be available from 12 noon on Friday."
                : (checkoutMessage || defaultMessage)}
            </p>
          </div>
          
          <EventbriteEmbed
            eventbriteId={event.eventbriteId}
            containerId={`eventbrite-${event.slug}`}
            eventTitle={event.title}
            eventSlug={event.slug}
            promoCode={event.promoCode}
            height={425}
            showTrustStrip={showEventbriteTrustStrip}
          />
        </div>
      </div>
    </section>
  );
};
