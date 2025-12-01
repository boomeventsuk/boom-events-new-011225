import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface EventCardProps {
  title: string;
  date: string;
  venue: string;
  time: string;
  poster: string;
  eventCode: string;
  isoDate: string;
  badge?: string;
  buttonText?: string;
  waitingListUrl?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  venue,
  time,
  poster,
  eventCode,
  isoDate,
  badge,
  buttonText,
  waitingListUrl,
}) => {
  const isSoldOut = badge === "SOLD OUT";
  
  const handleBookNow = () => {
    if (isSoldOut && waitingListUrl) {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'waiting_list_click',
          event_category: 'Waiting List',
          event_label: title,
          event_date: isoDate,
        });
      }
      window.open(waitingListUrl, '_blank');
    } else {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'book_now_click',
          event_category: 'Tickets',
          event_label: title,
          event_date: isoDate,
        });
      }
      window.location.href = `/event/${eventCode}`;
    }
  };

  return (
    <Card className={`bg-card border-border overflow-hidden hover:shadow-lg transition-shadow ${badge === "SOLD OUT" ? "opacity-80" : ""}`}>
      <div className="aspect-square overflow-hidden relative">
        <img
          src={poster}
          alt={`${title} event poster`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          decoding="async"
          width="800"
          height="800"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {badge && (
          <span className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wide ${
            badge === "SOLD OUT" ? "bg-red-500" : "bg-green-500"
          }`}>
            {badge}
          </span>
        )}
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
          {badge === "SOLD OUT" && <span className="text-red-500 mr-2">SOLD OUT -</span>}
          {title}
        </h3>
        
        <div className="space-y-1 text-muted-foreground mb-4">
          <p className="text-sm">{date}</p>
          <p className="text-sm">{time}</p>
          <p className="text-sm">{venue}</p>
        </div>

        <button
          onClick={handleBookNow}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-md font-medium"
        >
          {isSoldOut ? "Join Waiting List" : (buttonText || "Book Now")}
        </button>
      </CardContent>
    </Card>
  );
};
