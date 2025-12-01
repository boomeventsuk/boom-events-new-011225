import EventbriteEmbed from '@/components/EventbriteEmbed';

interface CheckoutSectionProps {
  event: {
    slug: string;
    eventbriteId: string;
    title: string;
    promoCode?: string;
    isSoldOut?: boolean;
    waitingListUrl?: string;
  };
}

export const CheckoutSection = ({ event }: CheckoutSectionProps) => {
  const handleWaitingListClick = () => {
    if (event.waitingListUrl) {
      window.open(event.waitingListUrl, '_blank');
    }
  };

  if (event.isSoldOut) {
    return (
      <section id="checkout-section" className="py-10 md:py-14 bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card/50 border border-primary/30 rounded-2xl p-6 md:p-10">
            <div className="text-center">
              <div className="inline-flex w-16 h-16 bg-red-500/20 rounded-full items-center justify-center mb-4 text-3xl">
                🎫
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-red-500">
                SOLD OUT
              </h2>
              <p className="text-lg text-foreground/70 mb-6">
                This event has sold out! Join the waiting list to be notified if tickets become available.
              </p>
              <button
                onClick={handleWaitingListClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-8 py-4 rounded-md font-semibold text-lg"
              >
                JOIN WAITING LIST
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="checkout-section" className="py-10 md:py-14 bg-primary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card/50 border border-primary/30 rounded-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4 text-3xl">
              🎟️
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Book Your Tickets
            </h2>
            <p className="text-lg text-foreground/70">
              Don't miss out! The most popular day party in the Midlands
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
