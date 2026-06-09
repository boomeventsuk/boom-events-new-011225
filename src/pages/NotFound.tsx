import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NextEventsStrip from "@/components/NextEventsStrip";
import CityEmailCapture from "@/components/CityEmailCapture";

const NotFound = () => {
  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>That one's gone | Boombastic Events</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />

      <section className="pt-32 pb-10 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="font-poppins text-4xl md:text-5xl font-bold text-foreground mb-3 uppercase">
            That one's gone.
          </h1>
          <p className="font-poppins text-xl md:text-2xl text-primary font-semibold mb-4">
            Here's what's next.
          </p>
          <p className="font-poppins text-muted-foreground mb-8">
            The page you were after has moved or the event has been and gone. The party has not stopped though.
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

export default NotFound;
