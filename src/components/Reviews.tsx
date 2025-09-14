const Reviews = () => {
  const quotes = [
    {
      text: "It's brilliant to be able to get out with your friends and you get a full night's sleep.",
      author: "SUE L",
      event: "Daytime Disco",
      backgroundImage: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709307/2PM_Crowd_Web_wmakid.jpg"
    },
    {
      text: "So many Anthems! You know every word, and so does everyone else. It's the ultimate 90s night.",
      author: "ALEX W", 
      event: "Boombastic 90s",
      backgroundImage: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709300/FL80s_Crowd_Web_xwfcan.jpg"
    },
    {
      text: "Totally the best night in the area. We never miss one. Love taking my headphones off just to soak in the beautiful chaos!",
      author: "FERN G",
      event: "Greatest Hits Silent Disco",
      backgroundImage: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709302/SDB_EVT_CROWD_b1j1ah.jpg"
    },
    {
      text: "My teenager actually smiled (and danced!) No one was glued to their phones, apart from taking photos of each other. A proper family game-changer.",
      author: "SARAH P",
      event: "Family Silent Disco",
      backgroundImage: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709305/FSD_Crowd_Web_rti2jb.jpg"
    }
  ];

  return (
    <section id="reviews" className="py-lg bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="font-bebas text-5xl md:text-6xl font-bold text-center mb-lg text-foreground">
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
              <div className="absolute inset-0 bg-white/90"></div>
              <div className="relative z-10 p-6">
                <h4 className="review-event font-bebas text-xl text-primary mb-2">
                  {quote.event}
                </h4>
                <div className="stars mb-3 text-yellow-500" aria-label="5 out of 5">
                  ★★★★★
                </div>
                <blockquote className="quote font-poppins font-bold text-black mb-4 leading-relaxed">
                  "{quote.text}"
                </blockquote>
                <div className="reviewer font-poppins font-semibold text-primary">
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