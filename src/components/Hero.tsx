import { Button } from "@/components/ui/button";
import fallbackHero from "@/assets/hero-crowd.jpg";

const heroImageUrl = "https://res.cloudinary.com/dteowuv7o/image/upload/v1757708204/Boom_Crowd_Web_bdke2o.jpg";

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

  return <section id="hero" className={`relative min-h-screen flex items-center justify-center overflow-hidden ${isChristmasDay() ? 'christmas-theme' : ''}`}>
      {/* Background Image with Overlay */}
      <img src={heroImageUrl} alt="Boombastic Events crowd at a party with colorful lights" className="absolute inset-0 w-full h-full object-cover" onError={e => {
      e.currentTarget.src = fallbackHero;
    }} />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-4">
        {isChristmasDay() && (
          <div className="mb-6 inline-block bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-foreground px-6 py-3 rounded-full text-lg md:text-xl font-poppins font-semibold christmas-shimmer">
            🎄 Merry Christmas from Boombastic! 🎅
          </div>
        )}
        <h1 className={`font-poppins text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-2 leading-tight uppercase ${isChristmasDay() ? 'christmas-gradient-text' : ''}`}>THE MIDLANDS' FAVOURITE PARTY STARTERS SINCE 2014.</h1>
        
        <h2 className="font-poppins text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight uppercase lg:text-5xl">TRUSTED BY THOUSANDS.</h2>
        
        <p className="font-poppins text-base text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto md:text-2xl">Whether you're after huge singalongs at 2pm or the beautiful chaos of a Silent Disco at 11pm, you're in the right place.</p>
        
        <Button onClick={() => scrollToSection('tickets')} size="lg" className={`font-semibold text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all uppercase tracking-wide ${isChristmasDay() ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-500 hover:to-green-500 text-foreground christmas-glow' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}>
          UPCOMING PARTIES
        </Button>
      </div>
    </section>;
};
export default Hero;