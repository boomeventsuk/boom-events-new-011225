import { Button } from "@/components/ui/button";

const FindYourParty = () => {
  const scrollToTickets = () => {
    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' });
  };

  const parties = [
    {
      title: "The 2PM Club™ Daytime Disco",
      description: "The Midland's most popular Day Party! Iconic 80s 90s 00s Anthems - Your best night out ever now happens in the afternoon.",
      image: "/lovable-uploads/70d32a18-1fe7-456a-bf1b-d3ed6fc325cd.png"
    },
    {
      title: "Silent Disco Parties",
      description: "10 years of Silent Chaos! Three DJs. Three channels. No compromise needed. Greatest Hits or Decades formats",
      image: "/lovable-uploads/83d46c39-bfc9-4b32-bebb-1e20c9a80f66.png"
    },
    {
      title: "Family Silent Disco",
      description: "Something for the whole family. 3 channels to choose from 🔵Party 🔴Throwback 🟢Charts. Everyone finds their vibe!",
      image: "/lovable-uploads/ee1df65c-a583-4507-8590-e8ba08a7981b.png"
    },
    {
      title: "Decades Parties",
      description: "Pick your decade: Footloose 80s, Boombastic 90s, Hey‑Ya 2000s.",
      image: "https://i.postimg.cc/p5NL27vD/FL80s.png"
    }
  ];

  return (
    <section id="parties" className="pt-2 pb-lg bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-bebas text-5xl md:text-6xl font-bold text-center mb-lg text-foreground">
          Find Your Party
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {parties.map((party, index) => (
            <div key={index} className="party-tile aspect-video hover:shadow-lg transition-all duration-300 group" data-party-tile>
              <img 
                src={party.image}
                alt={party.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="tile-content">
                <h3 className="font-bebas text-white font-bold tile-title">
                  {party.title}
                </h3>
                <p className="font-poppins text-white leading-relaxed tile-blurb">
                  {party.description}
                </p>
                <Button 
                  onClick={scrollToTickets}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-poppins font-semibold tile-cta"
                >
                  See dates
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