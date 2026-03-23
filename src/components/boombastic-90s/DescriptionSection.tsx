interface DescriptionSectionProps {
  event: {
    city: string;
    fullDescription: string;
  };
}

export const DescriptionSection = ({ event }: DescriptionSectionProps) => {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            🪩 {event.city.toUpperCase()}, YOUR FAVOURITE 90s NIGHT IS BACK!
          </h2>
          
          <div className="space-y-6 text-lg text-foreground/90">
            <p className="text-xl leading-relaxed">
              You had a favourite Spice Girl. You picked a side in August '95, Blur or Oasis, 
              and you still stand by it. You knew every word to Don't Look Back in Anger before 
              you even understood what it meant.
            </p>
              
            <p className="leading-relaxed">
              <strong className="text-primary">BOOMBASTIC: ALL OF THE NINETIES</strong> is four hours of that. 
              Pop perfection, Britpop anthems, dance floor euphoria, hip-hop swagger — the whole decade, 
              played exactly the way it should be. No filler. No apologies. No guilty pleasures, 
              because in the 90s none of it was guilty.
            </p>

            <p className="leading-relaxed">
              This was the decade that proved genre didn't matter. You loved TLC and Oasis and 
              Faithless and the Spice Girls all at the same time, and that was absolutely fine. It still is.
            </p>
              
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 bg-muted/30 rounded-r-lg">
              <p className="text-xl italic">
                "I forgot how much I loved that decade until I was in a room full of people 
                who felt exactly the same. Absolutely brilliant." ✨
              </p>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};
