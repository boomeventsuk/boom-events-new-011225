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
  const defaultMessage = "Don't miss out! The most popular day party in the Midlands";
  
  return (
    <section id="checkout-section" className="py-10 md:py-14 bg-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card/50 border border-primary/30 rounded-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4 text-3xl">
              🎟️
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {event.isSoldOut ? "Join the Waiting List" : "Book Your Tickets"}
            </h2>
            <p className="text-lg text-foreground/70">
              {event.isSoldOut 
                ? "This event has sold out! Join the waiting list via Eventbrite below" 
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
          />
        </div>
      </div>
    </section>
  );
};
