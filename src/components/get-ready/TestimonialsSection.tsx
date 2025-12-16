const testimonials = [
  {
    quote: "Took me right back to my youth! The DJ knew exactly what we wanted to hear. Can't wait for the next one.",
    name: "Sandra M",
    location: "Northampton"
  },
  {
    quote: "Best Sunday afternoon I've had in years. My feet haven't stopped tapping since!",
    name: "Derek P",
    location: "Bedford"
  },
  {
    quote: "The atmosphere was incredible - everyone singing along to every song. Pure magic.",
    name: "Christine T",
    location: "Milton Keynes"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-transparent to-amber-500/5">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            What People Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-card/30 border border-border/30 rounded-xl"
              >
                <div className="text-amber-400 mb-3">★★★★★</div>
                <p className="text-foreground/90 italic mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="text-sm">
                  <span className="font-semibold">{testimonial.name}</span>
                  <span className="text-foreground/60"> · {testimonial.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
