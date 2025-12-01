export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Best afternoon of my life! Home by 7, no hangover, all the fun!",
      author: "SARAH M",
      location: "NORTHAMPTON"
    },
    {
      quote: "Finally, a party that doesn't write off my entire weekend. Genius concept!",
      author: "JAMES T",
      location: "MILTON KEYNES"
    },
    {
      quote: "The perfect hen do! We danced our hearts out and still made dinner reservations.",
      author: "EMMA L",
      location: "BEDFORD"
    }
  ];

  return (
    <section className="py-10 md:py-14 bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Why You Love The 2PM Club
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
