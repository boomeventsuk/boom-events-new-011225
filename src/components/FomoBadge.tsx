import React from "react";
import { cn } from "@/lib/utils";

export interface FomoBadgeProps {
  tier: string;
  message: string;
  timeMessage?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const tierStyles: Record<string, string> = {
  critical: "bg-red-500 text-white animate-pulse",
  urgent: "bg-amber-500 text-white",
  low: "bg-orange-500 text-white",
  percent_80: "bg-orange-500 text-white",
  percent_70: "bg-orange-500 text-white",
  percent_60: "bg-yellow-500 text-black",
  selling_fast: "bg-yellow-500 text-black",
  on_sale: "bg-green-500 text-white",
  sold_out: "bg-red-600 text-white",
};

const timeStyles = "bg-blue-500 text-white";

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
};

export const FomoBadge: React.FC<FomoBadgeProps> = ({
  tier,
  message,
  timeMessage,
  className,
  size = "md",
}) => {
  const badgeStyle = tierStyles[tier] || tierStyles.on_sale;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <span
        className={cn(
          "inline-flex items-center font-bold rounded-full shadow-lg uppercase tracking-wide",
          badgeStyle,
          sizeStyles[size]
        )}
      >
        {message}
      </span>
      {timeMessage && (
        <span
          className={cn(
            "inline-flex items-center font-bold rounded-full shadow-lg uppercase tracking-wide",
            timeStyles,
            sizeStyles[size]
          )}
        >
          {timeMessage}
        </span>
      )}
    </div>
  );
};

export default FomoBadge;