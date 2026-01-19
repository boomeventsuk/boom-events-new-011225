const benefits = [
  {
    emoji: "🎧",
    title: "Three Channels = No Compromise",
    description: "Blue for little ones (Disney, party hits), Green for tweens/teens (current charts), Red for parents (80s/90s/00s throwbacks). Same dance floor, same time. Your 5-year-old gets Moana, your 12-year-old gets Sabrina Carpenter, you get Spice Girls. Nobody's bored, nobody's compromising."
  },
  {
    emoji: "📈",
    title: "Grows With Your Family",
    description: "The 7-11 age overlap means kids can switch between Blue (party hits) and Green (charts) as their tastes evolve. You don't 'age out' of this event - as they outgrow Disney, they just flip channels. Same event works for years."
  },
  {
    emoji: "🎉",
    title: "Parents Genuinely Have Fun",
    description: "This is the one parents consistently mention: 'I can't believe I enjoyed it more than my kids... and they enjoyed it a LOT!' Unlike soft play where you're clock-watching, or kids' parties where you're stood at the side scrolling your phone - you're actually on the dance floor properly losing it to Wannabe on the Red channel while they're loving their own music right next to you. Same space, same energy, different soundtracks."
  },
  {
    emoji: "💚",
    title: "Sensory-Smart & Confidence-Building",
    description: "Individual volume control means it's comfortable for everyone, including sensory-sensitive kids. Your shy 7-year-old can sing Disney songs at full volume without worrying. Your teen can dance without being embarrassed. Everyone participates at their own comfort level."
  }
];

export const WhyParentsLoveItSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-green-50 to-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
          Why Parents Love Family Silent Disco
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          It's the first time we've found something we ALL genuinely loved!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-5xl mb-4">{benefit.emoji}</div>
              <h3 className="text-xl font-bold mb-3 text-foreground">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
