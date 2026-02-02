import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FindYourParty from "@/components/FindYourParty";
import Tickets from "@/components/Tickets";
import About from "@/components/About";
import Reviews from "@/components/Reviews";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <FindYourParty />
      <Tickets />
      <About />
      <Reviews />
      
      {/* Jobs callout */}
      <section className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="font-poppins text-muted-foreground">
            Fancy joining our team?{" "}
            <a 
              href="/jobs" 
              className="text-primary hover:underline font-medium"
            >
              More details →
            </a>
          </p>
        </div>
      </section>
      
      <Footer />
    </main>
  );
};

export default Index;