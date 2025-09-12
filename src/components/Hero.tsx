import { Button } from "@/components/ui/button";
import fallbackHero from "@/assets/hero-crowd.jpg";
const heroImageUrl = "https://res.cloudinary.com/dteowuv7o/image/upload/v1757708204/Boom_Crowd_Web_bdke2o.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <img
        src={heroImageUrl}
        alt="Boombastic Events crowd at a party with colorful lights"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = fallbackHero;
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-4">
        <h1 className="font-bebas text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-2 leading-tight uppercase">
          10 YEARS OF SELL-OUT PARTIES ACROSS THE MIDLANDS.
        </h1>
        
        <h2 className="font-bebas text-3xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight uppercase">
          CREATED FOR YOU.
        </h2>
        
        <p className="font-poppins text-base md:text-lg text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
          For over a decade we've been creating good times across the Midlands with our popular Decades and Silent Disco parties. Whether you're after huge singalongs at 2pm or the beautiful chaos of a Silent Disco at 11pm, you're in the right place. We do partying right (for you).
        </p>
        
        <Button 
          onClick={() => scrollToSection('tickets')}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
        >
          Book Your Next Night Out
        </Button>
      </div>
    </section>
  );
};

export default Hero;