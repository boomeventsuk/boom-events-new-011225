import { EIGHTIES_EVENT_SUBLINE, isTwoPmEightiesEdition, twoPmDisplayFullDescription } from '@/lib/twoPmEdition';

interface DescriptionSectionProps {
  event: {
    title: string;
    location: string;
    fullDescription: string;
  };
}

export const DescriptionSection = ({ event }: DescriptionSectionProps) => {
  const isChristmas = event.title.toLowerCase().includes('christmas');
  const isEightiesEdition = isTwoPmEightiesEdition(event);
  const city = event.location.split(',')[1]?.trim() || '';
  const venue = event.location.split(',')[0]?.trim() || '';
  const christmasParagraphs = event.fullDescription
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .slice(3);

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card/50 border border-border/30 rounded-2xl p-6 md:p-10">
          {isChristmas ? (
            <>
              <p className="text-sm md:text-base font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                Christmas Edition
              </p>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
                THE 2PM CLUB Christmas Daytime Disco
              </h2>
              <p className="text-lg md:text-xl font-semibold text-primary mb-8">
                Your best night out. In the middle of the afternoon.
              </p>
              <div className="space-y-5 text-lg text-foreground/85 leading-relaxed">
                {christmasParagraphs.map((paragraph, index) => {
                  if (/^WHY YOUR CREW WILL LOVE IT$/i.test(paragraph)) {
                    return (
                      <h3 key={paragraph} className="text-2xl font-bold text-foreground pt-4">
                        Why your crew will love it
                      </h3>
                    );
                  }

                  if (/^(🎄|🎤|🥂|🕑|👯‍♀️|🎉)/u.test(paragraph)) {
                    return (
                      <div key={`${paragraph}-${index}`} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                        {paragraph}
                      </div>
                    );
                  }

                  if (paragraph.startsWith('"')) {
                    return (
                      <blockquote key={paragraph} className="border-l-4 border-primary pl-5 py-2 text-xl italic text-foreground/90">
                        {paragraph}
                      </blockquote>
                    );
                  }

                  return <p key={`${paragraph}-${index}`}>{paragraph}</p>;
                })}
              </div>
            </>
          ) : isEightiesEdition ? (
            <>
              <p className="text-lg md:text-xl font-semibold mb-4">
                THE 2PM CLUB GOES FULL-ON 80s IN {city.toUpperCase()}.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary mb-6">
                {EIGHTIES_EVENT_SUBLINE}
              </p>
              <blockquote className="border-l-4 border-primary pl-6 py-4 mb-6 text-xl md:text-2xl italic text-foreground/90">
                "THE 2PM CLUB goes full-on 80s at {venue}{city ? `, ${city}` : ''}."
              </blockquote>
              <div className="prose prose-invert prose-lg max-w-none space-y-4 text-foreground/80">
                {twoPmDisplayFullDescription(event).split('\n\n').map((paragraph, index) => (
                  <p key={paragraph} className={index === 0 ? 'font-bold text-foreground' : undefined}>
                    {paragraph}
                  </p>
                ))}
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
                  Welcome to THE 2PM CLUB, the daytime disco revolution that's taking the UK by storm. 
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
                  doesn't write off your entire weekend, this is your new favourite thing.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
