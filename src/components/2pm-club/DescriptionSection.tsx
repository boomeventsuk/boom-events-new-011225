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
                THE 2PM CLUB CHRISTMAS DAYTIME DISCO HITS {city.toUpperCase()}.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary mb-6">
                4 Hours of Iconic Anthems & Festive Favourites. Home by 7(ish).
              </p>
              <blockquote className="border-l-4 border-primary pl-6 py-4 mb-6 text-xl md:text-2xl italic text-foreground/90">
                "Remember when Christmas parties didn't mean losing your entire weekend to regret?"
              </blockquote>
              <div className="prose prose-invert prose-lg max-w-none space-y-4 text-foreground/80">
                <p>
                  Welcome to THE 2PM CLUB Christmas Daytime Disco — the festive get-together your group chat 
                  can actually agree on. From 2PM sharp, we're upgrading your December with neon fairy lights 
                  and wall-shaking 80s, 90s & 00s anthems, spiked with the festive bangers you've been miming 
                  in the car since November.
                </p>
                <p className="font-bold text-foreground">
                  Your best night out is NOW in the afternoon.
                </p>
                <p>
                  This isn't your work's half-hearted Secret Santa do. This is full club production — confetti 
                  cannons, dazzling lights, and DJs who know exactly when to drop "All I Want For Christmas Is You." 
                  By 7pm, you'll be back on the sofa, glowing like Rudolph, still humming Mariah. Whether you're 
                  ditching the office party or finally doing something that doesn't involve being polite to Dave 
                  from accounts — this is how you do Christmas.
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
