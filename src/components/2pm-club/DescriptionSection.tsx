interface DescriptionSectionProps {
  event: {
    title: string;
    location: string;
    fullDescription: string;
  };
}

export const DescriptionSection = ({ event }: DescriptionSectionProps) => {
  const isChristmas = event.title.toLowerCase().includes('christmas');
  const city = event.location.split(',')[1]?.trim() || '';

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card/50 border border-border/30 rounded-2xl p-6 md:p-10">
          {isChristmas ? (
            <>
              <p className="text-lg md:text-xl font-semibold mb-4">
                The 2PM Club Daytime Disco returns to {city} for a Christmas special!
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary mb-6">
                An Afternoon of Iconic 80s 90s 00s Anthems plus Festive Classics!
              </p>
              <blockquote className="border-l-4 border-primary pl-6 py-4 mb-6 text-xl md:text-2xl italic text-foreground/90">
                "Your Christmas Party just got upgraded... to the afternoon!"
              </blockquote>
              <div className="prose prose-invert prose-lg max-w-none space-y-4 text-foreground/80">
                <p>
                  No more yawning through midnight office do's. From 2PM sharp, we're upgrading 
                  your December with neon fairy lights, and wall‑shaking 80s, 90s & 00s anthems - 
                  spiked with the festive bangers you've been miming in the car since November.
                </p>
                <p className="font-bold text-foreground">
                  Your best night out is NOW in the afternoon.
                </p>
                <p>
                  By 7 PM, you'll be back on the sofa for Strictly, glowing like Rudolph with 
                  your voice happily gone. It's all the festive fun with your mates, none of 
                  the Sunday regret.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg md:text-xl font-semibold mb-4">
                THE 2PM CLUB DAYTIME DISCO RETURNS TO {city.toUpperCase()}.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary mb-6">
                An Afternoon of Iconic Anthems from the 80s 90s 00s!
              </p>
              <blockquote className="border-l-4 border-primary pl-6 py-4 mb-6 text-xl md:text-2xl italic text-foreground/90">
                "Remember when going OUT OUT didn't require a week's recovery?"
              </blockquote>
              <div className="prose prose-invert prose-lg max-w-none space-y-4 text-foreground/80">
                <p>
                  Welcome to THE 2PM CLUB — the daytime disco revolution that's taking the UK by storm. 
                  Four hours of pure nostalgia, singalong anthems, and confetti moments. All the energy 
                  of a Saturday night out, but you'll be home by 7pm to watch Strictly.
                </p>
                <p>
                  This isn't some watered-down afternoon tea disco. This is a full-blown club experience 
                  with professional sound, lighting, and DJs who know exactly how to work a crowd. The 
                  only difference? You'll actually remember it in the morning.
                </p>
                <p>
                  Whether you're celebrating a birthday, hen do, or just fancy a proper day out that 
                  doesn't write off your entire weekend — this is your new favourite thing.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
