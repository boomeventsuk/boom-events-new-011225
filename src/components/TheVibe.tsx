const TheVibe = () => {
  const quotes = [
    {
      text: "It's brilliant to be able to get out with your friends and you get a full night's sleep.",
      author: "Sue L",
      event: "Daytime Disco"
    },
    {
      text: "So many Anthems! You know every word, and so does everyone else. It's the ultimate 90s night.",
      author: "Alex W", 
      event: "Boombastic 90s"
    },
    {
      text: "Totally the best night in the area. We never miss one. Love taking my headphones off just to soak in the beautiful chaos!",
      author: "Fern G",
      event: "Greatest Hits Silent Disco"
    },
    {
      text: "My teenager actually smiled (and danced!) No one was glued to their phones, apart from taking photos of each other. A proper family game-changer.",
      author: "Sarah P",
      event: "Family Silent Disco"
    }
  ];

  return (
    <section id="reviews" className="py-xl bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-bebas text-5xl md:text-6xl font-bold text-center mb-lg text-foreground">
          What People Say
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {quotes.map((quote, index) => (
            <div key={index} className="review-card bg-card p-8 rounded-lg border border-border relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50"></div>
              <div className="relative z-10">
                <h4 className="review-event font-bebas text-xl font-bold text-primary mb-2">
                  {quote.event}
                </h4>
                <div className="stars" aria-label="5 out of 5">★★★★★</div>
                <blockquote className="quote font-poppins text-lg text-foreground mb-6 leading-relaxed italic">
                  "{quote.text}"
                </blockquote>
                <div className="reviewer font-bebas text-xl font-bold text-primary">
                  {quote.author}
                </div>
                <div className="context font-poppins text-sm text-muted-foreground">
                  {quote.event}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TheVibe;