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
      <Footer />
    </main>
  );
};

export default Index;