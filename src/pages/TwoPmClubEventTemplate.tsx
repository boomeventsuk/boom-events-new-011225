import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import TwoPmClubEventPage, { TwoPmClubEvent } from "@/components/TwoPmClubEventPage";
import NotFound from "./NotFound";

const TwoPmClubEventTemplate = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<TwoPmClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/events-2pm-club.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
      .then((events: TwoPmClubEvent[]) => {
        const found = events.find(e => e.slug === slug);
        setEvent(found || null);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return <NotFound />;
  }
  
  return <TwoPmClubEventPage event={event} />;
};

export default TwoPmClubEventTemplate;
