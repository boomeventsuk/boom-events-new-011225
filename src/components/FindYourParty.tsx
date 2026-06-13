import { Button } from "@/components/ui/button";

const FindYourParty = () => {
  const parties = [
    {
      title: "The 2PM Club™ Daytime Disco",
      description: "The Midlands' most popular day party. Iconic 80s anthems in the afternoon.",
      image: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/2PM%20Crowd%20Web.jpg",
      href: "https://www.the2pmclub.co.uk"
    },
    {
      title: "Silent Disco Parties",
      description: "10 years of silent chaos. Three DJs, three channels, no compromise needed.",
      image: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/SDB_EVT_CROWD.jpg",
      href: "/silent-disco/"
    },
    {
      title: "Family Silent Disco",
      description: "Three channels: Party, Throwback, Charts. The whole family finds their vibe.",
      image: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/FSD%20Crowd%20Web.jpg",
      href: "/family-silent-disco/"
    },
    {
      title: "Decades Parties",
      description: "Pick your decade: Footloose 80s or Boombastic 90s.",
      image: "https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/FL80s%20Crowd%20Web.jpg",
      href: "/footloose-80s/"
    }
  ];

  return (
    <section id="parties" className="pt-2 pb-lg bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-poppins text-5xl md:text-6xl font-bold text-center mb-lg text-foreground">
          Find Your Party
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {parties.map((party, index) => (
            <div key={index} className="party-tile aspect-video hover:shadow-lg transition-all duration-300 group" data-party-tile>
              <img 
                src={`${party.image}?width=800&quality=75`}
                alt={party.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="tile-content">
                <h3 className="font-poppins text-white font-bold tile-title">
                  {party.title}
                </h3>
                <p className="font-poppins text-white leading-relaxed tile-blurb">
                  {party.description}
                </p>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-poppins font-semibold tile-cta"
                >
                  <a href={party.href}>See dates</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FindYourParty;
