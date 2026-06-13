import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { eventPath, isEventPassed } from "@/lib/eventUtils";
import { normaliseTwoPmEditionEvent } from "@/lib/twoPmEdition";

interface StripEvent {
  eventCode: string;
  title: string;
  start: string;
  end?: string;
  venue: string;
  city: string;
  isHidden?: boolean;
  isSoldOut?: boolean;
}

// "Sat 13th Jun" house date style
const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][day % 10] || "th";
  return `${days[d.getDay()]} ${day}${suffix} ${months[d.getMonth()]}`;
};

const NextEventsStrip = () => {
  const [events, setEvents] = useState<StripEvent[] | null>(null);

  useEffect(() => {
    fetch("/events-boombastic.json")
      .then((res) => res.json())
      .then((data: StripEvent[]) => {
        const upcoming = data
          .filter((e) => !e.isHidden && !isEventPassed(e))
          .sort((a, b) => a.start.localeCompare(b.start))
          .slice(0, 3)
          .map((e) => normaliseTwoPmEditionEvent(e));
        setEvents(upcoming);
      })
      .catch(() => setEvents([]));
  }, []);

  if (events && events.length === 0) return null;

  return (
    <section aria-label="Next events" className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <p className="font-poppins text-xs font-semibold tracking-widest text-primary uppercase mb-3 text-center">
          Next up
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {events === null
            ? [0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                  <div className="h-4 w-24 bg-muted rounded mb-2" />
                  <div className="h-5 w-40 bg-muted rounded mb-2" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ))
            : events.map((ev) => (
                <Link
                  key={ev.eventCode}
                  to={eventPath(ev.eventCode)}
                  className="rounded-lg border border-border bg-card p-4 hover:border-primary transition-colors group"
                >
                  <p className="font-poppins text-sm font-semibold text-primary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatShortDate(ev.start)}
                  </p>
                  <p className="font-poppins font-bold text-foreground leading-snug mt-1 group-hover:text-primary transition-colors">
                    {ev.title}
                  </p>
                  <p className="font-poppins text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {ev.venue}, {ev.city}
                  </p>
                  <p className="font-poppins text-sm font-semibold mt-2 text-foreground">
                    {ev.isSoldOut ? "Sold out" : "Book tickets"}
                  </p>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};

export default NextEventsStrip;
