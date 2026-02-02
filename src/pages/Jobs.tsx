import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Jobs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <Link 
          to="/" 
          className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-poppins">Back to Events</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bebas text-foreground mb-4 tracking-wider">
            WORK WITH US
          </h1>
          <p className="text-xl text-primary font-poppins">Be part of the Midlands' favourite daytime disco.</p>
        </header>

        {/* Job Listing */}
        <div className="space-y-8">
          {/* Role Header */}
          <section className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">
              Event Assistant | £15/hour | Weekends
            </h2>
            <p className="text-muted-foreground leading-relaxed font-poppins">
              We need a couple of people to join us at events across Northampton, Bedford, Milton Keynes, Coventry and beyond.
            </p>
          </section>

          {/* What You'll Do */}
          <section className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">What You'll Do</h2>
            <p className="text-muted-foreground leading-relaxed font-poppins">
              Arrive with the DJ. Help set up. Once the room fills up, you're on the floor capturing the good stuff on video. The singalongs, the dance-offs, the moments that make people tag their mates. You'll grab quick clips of guests talking about why they keep coming back. We'll give you our cameras. If the DJ needs five minutes, you keep the decks ticking over. At the end, you help pack down.
            </p>
          </section>

          {/* Who We're Looking For */}
          <section className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Who We're Looking For</h2>
            <p className="text-muted-foreground leading-relaxed font-poppins">
              Someone confident and bubbly who doesn't need to be told what to do. You see something that needs doing, you do it. You've got an eye for the moment worth capturing. You're the kind of person strangers open up to. You'd rather be in the thick of it than watching from the side.
            </p>
          </section>

          {/* Location & Availability */}
          <section className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">Location & Availability</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3 font-poppins">
              <p>
                You'll need to be based in or around Northampton, or able to get yourself to events. Our DJs usually head out from Northampton, so you can travel with them if that works better.
              </p>
              <p>
                We run events most weekends. You don't need to be available for all of them. Just let us know which ones work for you.
              </p>
              <p>
                No experience needed. No kit needed. Just energy, initiative, and the instinct to know when to hit record.
              </p>
            </div>
          </section>

          {/* This Isn't For Everyone */}
          <section className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-4">This Isn't For Everyone</h2>
            <p className="text-muted-foreground leading-relaxed font-poppins">
              If you need a lot of direction or prefer to blend into the background, this isn't your thing. But if you want to be part of something that sells out, surrounded by people having the time of their lives, we want to hear from you.
            </p>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bebas text-foreground mb-4">Ready to Join Us?</h2>
          <p className="text-muted-foreground mb-6 font-poppins">Drop us an email and tell us a bit about yourself.</p>
          <a 
            href="mailto:hello@boomevents.co.uk?subject=Event%20Assistant%20Role"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors font-poppins"
          >
            Get In Touch
          </a>
        </div>
      </main>
    </div>
  );
};

export default Jobs;
