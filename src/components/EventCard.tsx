import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { FomoBadge } from "@/components/FomoBadge";
import { useEventFomoData } from "@/hooks/useEventFomoData";

const isChristmasDay = () => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 25;
};
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
}) => {
  const { data: fomoData } = useEventFomoData(eventCode);
  const isSoldOut = fomoData?.is_sold_out || badge === "SOLD OUT";
  
  // Use FOMO data if available, otherwise fallback to static badge
  const displayBadge = fomoData?.fomo_message || badge;
  const fomoTier = fomoData?.fomo_tier || (badge === "SOLD OUT" ? "sold_out" : "on_sale");
  
  const handleBookNow = () => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: isSoldOut ? 'waiting_list_click' : 'book_now_click',
        event_category: isSoldOut ? 'Waiting List' : 'Tickets',
        event_label: title,
        event_date: isoDate,
      });
    }
    window.location.href = `/event/${eventCode}`;
  };

  return (
    <Card className={`bg-card border-border overflow-hidden hover:shadow-lg transition-shadow ${isSoldOut ? "opacity-80" : ""} ${isChristmasDay() ? "christmas-border christmas-glow" : ""}`}>
      <Link to={`/event/${eventCode}`} className="block aspect-square overflow-hidden relative">
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
        {displayBadge && (
          <div className="absolute top-3 right-3">
            <FomoBadge
              tier={fomoTier}
              message={displayBadge}
              timeMessage={fomoData?.time_message}
              size="sm"
            />
          </div>
        )}
      </Link>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
          {isSoldOut && <span className="text-red-500 mr-2">SOLD OUT -</span>}
          {title}
        </h3>
        
        <div className="space-y-1 text-muted-foreground mb-4">
          <p className="text-sm">{date}</p>
          <p className="text-sm">{time}</p>
          <p className="text-sm">{venue}</p>
        </div>

        <button
          onClick={handleBookNow}
          className={`w-full transition-colors px-4 py-2 rounded-md font-medium ${isChristmasDay() ? "bg-gradient-to-r from-red-600 to-green-600 hover:from-red-500 hover:to-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
        >
          {isSoldOut ? "Join Waiting List" : (buttonText || "Book Now")}
        </button>
      </CardContent>
    </Card>
  );
};
