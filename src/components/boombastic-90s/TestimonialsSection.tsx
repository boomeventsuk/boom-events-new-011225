export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "I forgot how much I loved that decade until I was in a room full of people who felt exactly the same. Absolutely brilliant.",
      author: "EMMA R",
      location: "NORTHAMPTON"
    },
    {
      quote: "Best 90s night I've been to. Every single song was a banger. Can't wait for the next one!",
      author: "JAMES K",
      location: "NORTHAMPTON"
    }
  ];

  return (
    <section className="py-10 md:py-14 bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          🌟 WHAT PEOPLE SAY
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="bg-card/50 border border-border/30 rounded-xl p-6"
            >
              <div className="text-yellow-400 text-xl mb-4">
                ★★★★★
              </div>
              <blockquote className="text-lg font-semibold mb-4 text-foreground/90">
                "{testimonial.quote}"
              </blockquote>
              <p className="text-sm uppercase text-foreground/60">
                {testimonial.author}, {testimonial.location}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
