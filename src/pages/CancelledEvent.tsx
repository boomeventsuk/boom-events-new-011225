import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NextEventsStrip from "@/components/NextEventsStrip";
import CityEmailCapture from "@/components/CityEmailCapture";

interface CancelledEventProps {
  title?: string;
  venue?: string;
  city?: string;
}

// Shown by EventTemplate.tsx in place of the normal ticket/booking page for
// any event with isCancelled: true. Mirrors NotFound.tsx's noindex pattern,
// but tells the visitor plainly that the event was cancelled rather than
// implying the page itself is missing.
const CancelledEvent = ({ title, venue, city }: CancelledEventProps) => {
  const place = [venue, city].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{title ? `${title}: Cancelled` : "This event has been cancelled"} | Boombastic Events</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <section className="pt-32 pb-10 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="font-poppins text-4xl md:text-5xl font-bold text-foreground mb-3 uppercase">
            This event has been cancelled
          </h1>
          {title && (
            <p className="font-poppins text-xl md:text-2xl text-primary font-semibold mb-2">
              {title}
            </p>
          )}
          {place && (
            <p className="font-poppins text-muted-foreground mb-4">{place}</p>
          )}
          <p className="font-poppins text-muted-foreground mb-8">
            This date will not be going ahead. If you already have a ticket, Eventbrite will
            be in touch about your refund. Sorry for the disappointment, here is what's next.
          </p>
          <Button asChild size="lg" className="font-poppins font-semibold">
            <Link to="/">See all upcoming parties</Link>
          </Button>
        </div>
      </section>

      <NextEventsStrip />
      <CityEmailCapture />

      <Footer />
    </main>
  );
};

export default CancelledEvent;
