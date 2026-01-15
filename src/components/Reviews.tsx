const Reviews = () => {
  const quotes = [
    {
      text: "It's brilliant to be able to get out with your friends and you get a full night's sleep.",
      author: "SUE L",
      event: "Daytime Disco",
      backgroundImage: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/2PM%20Crowd%20Web.jpg"
    },
    {
      text: "So many Anthems! You know every word, and so does everyone else. It's the ultimate 80s night.",
      author: "ALEX W", 
      event: "Footloose 80s",
      backgroundImage: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/FL80s%20Crowd%20Web.jpg"
    },
    {
      text: "Totally the best night in the area. We never miss one. Love taking my headphones off just to soak in the beautiful chaos!",
      author: "FERN G",
      event: "Greatest Hits Silent Disco",
      backgroundImage: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/SDB_EVT_CROWD.jpg"
    },
    {
      text: "My teenager actually smiled (and danced!) No one was glued to their phones, apart from taking photos of each other. A proper family game-changer.",
      author: "SARAH P",
      event: "Family Silent Disco",
      backgroundImage: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/FSD%20Crowd%20Web.jpg"
    }
  ];

  return (
    <section id="reviews" className="py-lg bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="font-poppins text-5xl md:text-6xl font-bold text-center mb-lg text-foreground">
          Don't Just Take Our Word For It...
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {quotes.map((quote, index) => (
            <div 
              key={index} 
              className="review-card relative overflow-hidden rounded-lg border border-border"
              style={{
                backgroundImage: `url(${quote.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-white/70"></div>
              <div className="relative z-10 p-6">
                <h4 className="review-event font-poppins text-3xl font-bold text-black mb-2">
                  {quote.event}
                </h4>
                <div className="stars mb-3 text-primary" aria-label="5 out of 5">
                  ★★★★★
                </div>
                <blockquote className="quote font-poppins font-bold text-black mb-4 leading-relaxed">
                  "{quote.text}"
                </blockquote>
                <div className="reviewer font-poppins font-bold text-black">
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

export default Reviews;