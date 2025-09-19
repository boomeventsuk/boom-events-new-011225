const About = () => {
  return (
    <section id="about" className="py-lg bg-background" aria-labelledby="about-title">
      <div className="container mx-auto px-4">
        <div className="about max-w-4xl mx-auto text-center">
          <h2 id="about-title" className="about-title font-poppins text-5xl md:text-6xl font-bold text-center mb-lg text-foreground">
            About Boombastic Events
          </h2>
          <p className="lead font-poppins text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Boombastic Events produces quality, inclusive sing-along parties across the Midlands —
            from <strong className="text-primary">The 2PM Club™ Daytime Disco</strong> to <strong className="text-primary">Family Silent Disco</strong>,
            after-dark <strong className="text-primary">Silent Disco</strong> and <strong className="text-primary">Decades</strong> nights.
            Established in 2014, we've delivered 250+ shows with a 95% sell-out rate across trusted venues
            in Northampton, Bedford, Milton Keynes, Coventry and Luton.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;