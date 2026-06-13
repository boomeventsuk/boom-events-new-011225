import { Button } from "@/components/ui/button";

const heroLqip = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABcQERQRDhcUEhQaGBcbIjklIh8fIkYyNSk5UkhXVVFIUE5bZoNvW2F8Yk5QcptzfIeLkpSSWG2grJ+OqoOPko3/2wBDARgaGiIeIkMlJUONXlBejY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY3/wAARCAASACADASIAAhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAAQBAgMF/8QAIBAAAgEEAgMBAAAAAAAAAAAAAAERAgMEIQUSMkFCUf/EABgBAAMBAQAAAAAAAAAAAAAAAAABAgME/8QAGREBAQEAAwAAAAAAAAAAAAAAAAERAhJB/9oADAMBAAIRAxEAPwCb3J1NQhGrIbcsVdxtyyruTo0tdM5Y3ryJY7jci7dPWTkdthLWydHb1Poz+gAEUfpZ+CABU4//2Q==";

const isChristmasDay = () => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 25;
};

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

  return <section id="hero" className={`relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-24 pb-12 ${isChristmasDay() ? 'christmas-theme' : ''}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroLqip})` }}
      />
      <img
        src="/img/boom-hero-party-1280.webp"
        srcSet="/img/boom-hero-party-768.webp 768w, /img/boom-hero-party-1280.webp 1280w, /img/boom-hero-party-1920.webp 1920w"
        sizes="100vw"
        fetchPriority="high"
        decoding="async"
        alt="Boombastic Events crowd singing and dancing at a packed party"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-125 saturate-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/45 via-background/5 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-4">
        {isChristmasDay() && (
          <div className="mb-6 inline-block bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-foreground px-6 py-3 rounded-full text-lg md:text-xl font-poppins font-semibold christmas-shimmer">
            🎄 Merry Christmas from Boombastic! 🎅
          </div>
        )}
        <h1 className={`font-poppins text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 leading-tight uppercase drop-shadow-[0_5px_28px_rgba(0,0,0,0.95)] ${isChristmasDay() ? 'christmas-gradient-text' : ''}`}>HUGE SINGALONGS AT 2PM. BEAUTIFUL CHAOS AT 11PM.</h1>
        
        <p className="font-poppins text-base text-foreground/90 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] md:text-2xl">The Midlands' favourite party starters since 2014. Trusted by thousands.</p>
        
        <Button onClick={() => scrollToSection('tickets')} size="lg" className={`font-semibold text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all uppercase tracking-wide ${isChristmasDay() ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-500 hover:to-green-500 text-foreground christmas-glow' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
          UPCOMING PARTIES
        </Button>
      </div>
    </section>;
};
export default Hero;
