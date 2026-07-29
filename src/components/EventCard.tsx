import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventPath, formatHouseDate, formatPriceLabel } from "@/lib/eventUtils";
import { pushToDataLayer } from "@/lib/dataLayer";
import { CHRISTMAS_2026_SALE_START, christmasSaleBadgeLabel } from "@/lib/christmasSale";

// Bunny Optimizer params for CDN-hosted images
const optimised = (url: string, width: number) =>
  url.includes("b-cdn.net") ? `${url}${url.includes("?") ? "&" : "?"}width=${width}&quality=75` : url;

const isChristmasDay = () => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 25;
};

export interface FomoOverride {
  tier: string;
  message: string;
  timeMessage?: string | null;
}

export interface GroupTicket {
  size: number;
  price: number;
  label: string;
}

export interface EventCardProps {
  title: string;
  start: string;
  city: string;
  venue: string;
  poster: string;
  eventCode: string;
  isSoldOut?: boolean;
  statusLabel?: string;
  priceLabel?: string;
  groupTicket?: GroupTicket | null;
  fomoOverride?: FomoOverride | null;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  start,
  city,
  venue,
  poster,
  eventCode,
  isSoldOut,
  statusLabel,
  priceLabel,
  groupTicket,
  fomoOverride,
}) => {
  const [saleClock, setSaleClock] = useState(Date.now());

  useEffect(() => {
    const delay = CHRISTMAS_2026_SALE_START - Date.now();
    if (delay <= 0) return;
    const timer = window.setTimeout(() => setSaleClock(Date.now()), delay + 100);
    return () => window.clearTimeout(timer);
  }, []);

  // ONE badge: sold out wins, then synced statusLabel, then fomoOverride fallback
  const badge = isSoldOut
    ? "SOLD OUT"
    : christmasSaleBadgeLabel(eventCode, statusLabel || fomoOverride?.message, false, saleClock);
  const isPreSale = badge === "ON SALE FRI";
  const price = formatPriceLabel(priceLabel);

  const handleClick = () => {
    pushToDataLayer({
      event: "select_item",
      item_list_id: "homepage_event_grid",
      item_list_name: "Homepage Event Grid",
      items: [
        {
          item_id: eventCode,
          item_name: title,
          item_category: city,
          item_variant: isSoldOut ? "sold_out" : "on_sale",
        },
      ],
    });
  };

  return (
    <Link
      to={eventPath(eventCode)}
      onClick={handleClick}
      className={`group relative block aspect-square overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-shadow ${isChristmasDay() ? "christmas-border christmas-glow" : ""}`}
      aria-label={`${title}, ${formatHouseDate(start)}, ${venue}, ${city}${isSoldOut ? ", sold out, join the waiting list" : ""}`}
      data-event-code={eventCode}
      data-click-source="event-card"
    >
      <img
        src={optimised(poster, 800)}
        srcSet={`${optimised(poster, 400)} 400w, ${optimised(poster, 800)} 800w`}
        alt={`${title} event poster`}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isSoldOut ? "grayscale" : ""}`}
        loading="lazy"
        decoding="async"
        width="800"
        height="800"
        sizes="(max-width: 1024px) 50vw, 33vw"
      />

      <h3 className="sr-only">{title}</h3>

      {/* Top row: badge left, price pill right - flex so they never overlap */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 p-2">
        {badge ? (
          <span
            className={`min-w-0 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight shadow-md ${isSoldOut ? "bg-red-600 text-white" : "bg-primary text-primary-foreground"}`}
          >
            {badge}
          </span>
        ) : (
          <span />
        )}
        {price && !isSoldOut && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-black/70 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-white shadow-md backdrop-blur-sm">
            {price}
          </span>
        )}
      </div>

      {/* Bottom gradient overlay: date + city, optional group line, CTA */}
      <div className="absolute inset-x-0 bottom-0 flex h-[28%] min-h-[72px] flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 pb-2.5 sm:px-4 sm:pb-3">
        <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
          {formatHouseDate(start, false)} · {city}
        </p>
        {!isSoldOut && groupTicket?.label && (
          <p className="text-[10px] sm:text-xs text-white/80 leading-tight mt-0.5">
            {groupTicket.label}
          </p>
        )}
        <p className="mt-1 text-xs sm:text-sm font-bold text-white/80 transition-colors group-hover:text-white group-active:text-white">
          {isSoldOut ? "Join the waiting list" : isPreSale ? "Event details →" : "Book tickets →"}
        </p>
      </div>
    </Link>
  );
};
