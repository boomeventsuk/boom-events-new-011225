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
            🪩 {event.city.toUpperCase()}, YOUR FAVOURITE 80s NIGHT IS BACK!
          </h2>
          
          <div className="space-y-6 text-lg text-foreground/90">
            <p className="text-xl leading-relaxed">
              Remember pressing record on your tape deck during the Top of the Pops countdown? 
              Blasting Madonna's "Like a Prayer" through your headphones? 
              Belting out Bon Jovi in your first car?
            </p>
            
            <p className="leading-relaxed">
              <strong className="text-primary">FOOTLOOSE 80s</strong> is your ticket back to those moments — 
              four hours of non-stop anthems from the greatest decade in music. 
              The songs you know every word to, played loud, with people who feel exactly the same way.
            </p>
            
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 bg-muted/30 rounded-r-lg">
              <p className="text-xl italic">
                "This isn't just any 80s night. This is the real deal — a proper party where 
                the dancefloor is full, the singalongs are epic, and the vibe is electric." ✨
              </p>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};
