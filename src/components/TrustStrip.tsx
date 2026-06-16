/**
 * Visible trust bar. Founder voice, no numeric badges: the hard figures live
 * only in the background GEO files for AI crawlers, per brand direction.
 * Matches THE 2PM CLUB trust strip. Mounted on the homepage and event pages.
 */
const TrustStrip = () => {
  return (
    <div className="bg-card border-y border-border">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-sm md:text-base font-poppins">
        <span className="text-foreground font-semibold">
          Been going since 2014
        </span>
        <span className="hidden sm:block text-muted-foreground">•</span>
        <span className="text-muted-foreground">
          Selling out across the Midlands
        </span>
      </div>
    </div>
  );
};

export default TrustStrip;
