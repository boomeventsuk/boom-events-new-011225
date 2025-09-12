import { Button } from "@/components/ui/button";

const FindYourParty = () => {
  const scrollToTickets = () => {
    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' });
  };

  const parties = [
    {
      title: "The 2PM Club™ Daytime Disco",
      description: "The Midland's most popular Day Party! Iconic 80s 90s 00s Anthems - Your best night out ever now happens in the afternoon.",
      image: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709307/2PM_Crowd_Web_wmakid.jpg"
    },
    {
      title: "Silent Disco Parties",
      description: "10 years of Silent Chaos! Three DJs. Three channels. No compromise needed. Greatest Hits or Decades formats",
      image: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709302/SDB_EVT_CROWD_b1j1ah.jpg"
    },
    {
      title: "Family Silent Disco",
      description: "Something for the whole family. 3 channels to choose from 🔵Party 🔴Throwback 🟢Charts. Everyone finds their vibe!",
      image: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709305/FSD_Crowd_Web_rti2jb.jpg"
    },
    {
      title: "Decades Parties",
      description: "Pick your decade: Footloose 80s, Boombastic 90s, Hey‑Ya 2000s.",
      image: "https://res.cloudinary.com/dteowuv7o/image/upload/v1757709300/FL80s_Crowd_Web_xwfcan.jpg"
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