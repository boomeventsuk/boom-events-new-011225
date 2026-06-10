import { Star, Users } from "lucide-react";

const TrustStrip = () => {
  return (
    <div className="bg-card border-y border-border">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-sm md:text-base font-poppins">
        <span className="flex items-center gap-2 text-foreground">
          <Star className="w-4 h-4 text-primary fill-primary" />
          4.9/5 from 250+ reviews
        </span>
        <span className="flex items-center gap-2 text-foreground">
          <Users className="w-4 h-4 text-primary" />
          23,000+ through the doors since 2014
        </span>
      </div>
    </div>
  );
};

export default TrustStrip;
