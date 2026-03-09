import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { PhotoGallery } from "@/components/2pm-club/PhotoGallery";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const heroImage = "https://boombastic-events.b-cdn.net/2PM%20Web%20Images/2pm_web_1_ndjab4.jpg";
const videoThumbnail = "https://boombastic-events.b-cdn.net/2PM%20web%20videos/2PM%20Web%20Video%20Thumbnail.jpg";
const videoSource = "https://boombastic-events.b-cdn.net/2PM%20web%20videos/2PM%20video%20low%20res.mp4";

const Jobs = () => {
  const [djOpen, setDjOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

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
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bebas text-foreground mb-4 tracking-wider">
            WORK WITH US
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-poppins mb-8 max-w-2xl mx-auto">
            We're Boombastic. Since 2014, we've thrown over 250 sell-out parties across the Midlands. We need a couple of people to be part of it.
          </p>
          
          {/* Hero Image */}
          <div className="relative rounded-xl overflow-hidden mb-8">
            <img 
              src={heroImage} 
              alt="Crowd at a Boombastic Events party with colourful lights and confetti" 
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
        </header>

        {/* Job Listings */}
        <div className="space-y-4">

          {/* DJ Role */}
          <Collapsible open={djOpen} onOpenChange={setDjOpen}>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border overflow-hidden transition-all">
              <CollapsibleTrigger className="w-full text-left p-6 flex items-center justify-between gap-4 group cursor-pointer hover:bg-card/80 transition-colors">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-1">
                    DJ – Boombastic Events
                  </h2>
                  <p className="text-muted-foreground font-poppins text-sm md:text-base">
                    Good rate of pay + transport costs | Weekends | Northampton, Bedford, Coventry, Milton Keynes, Luton, Leicester & beyond
                  </p>
                </div>
                <ChevronDown className={`h-6 w-6 text-primary shrink-0 transition-transform duration-300 ${djOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                  
                  {/* About */}
                  <section>
                    <p className="text-muted-foreground leading-relaxed font-poppins">
                      Boombastic Events runs ticketed music events across the Midlands — Northampton, Bedford, Coventry, Milton Keynes, Luton, and Leicester — with more locations planned. Our events are predominantly daytime (Saturday afternoons, 2pm–6pm) but we also run evening events (usually 4 hours, between 8pm and 1am).
                    </p>
                    <p className="text-muted-foreground leading-relaxed font-poppins mt-4">
                      The music is iconic 80s, 90s and 00s pop anthems — think Spice Girls, ABBA, Whitney Houston, Bon Jovi, Oasis, Take That, Beyoncé, Madonna, The Killers, Robbie Williams, Gloria Gaynor. Every track is a singalong. The crowd knows every word, and the energy in the room reflects that.
                    </p>
                  </section>

                  {/* What We're Looking For */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">What We're Looking For</h3>
                    <ul className="text-muted-foreground leading-relaxed font-poppins space-y-3">
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Strong on the mic — you're the host of the room, not just pressing play</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Comfortable working with structured playlists — the music and flow are provided, you bring the energy and delivery</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Reads the room — knowing when to hype it up and when to let the crowd carry the moment</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Reliable and consistent — we run across multiple locations and the experience needs to be the same everywhere</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Video DJing experience is a plus but not essential — we can walk you through our setup</li>
                    </ul>
                  </section>

                  {/* The Logistics */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">The Logistics</h3>
                    <ul className="text-muted-foreground leading-relaxed font-poppins space-y-3">
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> 4-hour sets with setup and packdown either side</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> We provide additional lighting and, where possible, music on a laptop for video DJing</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Kit is collected from and returned to our offices in Northampton (10 mins from J15/J15A, M1) — flexible on timing, whether that's the day before or the Monday after</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> You'll need your own transport for kit collection</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Good rate of pay, with full transport costs covered for certain events</li>
                    </ul>
                  </section>

                  {/* Interested */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">Interested?</h3>
                    <p className="text-muted-foreground leading-relaxed font-poppins">
                      If this sounds like your kind of gig, we'd love to hear from you. Hit the button below to tell us a bit about yourself and answer a few quick video questions. We'll be in touch.
                    </p>
                  </section>

                  {/* CTA */}
                  <div className="pt-2">
                    <a 
                      href="mailto:hello@boomevents.co.uk?subject=DJ%20Role%20-%20Boombastic%20Events"
                      className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors font-poppins text-lg"
                    >
                      Get In Touch
                    </a>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Event Assistant Role */}
          <Collapsible open={assistantOpen} onOpenChange={setAssistantOpen}>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border overflow-hidden transition-all">
              <CollapsibleTrigger className="w-full text-left p-6 flex items-center justify-between gap-4 group cursor-pointer hover:bg-card/80 transition-colors">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bebas text-primary mb-1">
                    Event Assistant
                  </h2>
                  <p className="text-muted-foreground font-poppins text-sm md:text-base">
                    £15/hour | Weekends | Northampton, Bedford, Milton Keynes, Coventry & beyond
                  </p>
                  <p className="text-muted-foreground font-poppins text-sm mt-1">
                    No experience needed. No kit needed. We'll give you full training.
                  </p>
                </div>
                <ChevronDown className={`h-6 w-6 text-primary shrink-0 transition-transform duration-300 ${assistantOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">

                  {/* What You'll Do */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">What You'll Do</h3>
                    <p className="text-muted-foreground leading-relaxed font-poppins">
                      Arrive with the DJ. Help set up. Once the room fills up, you're on the floor capturing the good stuff on video. The singalongs, the dance-offs, the moments that make people tag their mates. You'll grab quick clips of guests talking about why they keep coming back. We'll give you our cameras. If the DJ needs five minutes, you keep the decks ticking over. At the end, you help pack down.
                    </p>
                  </section>

                  {/* Who We're Looking For */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">Who We're Looking For</h3>
                    <div className="text-muted-foreground leading-relaxed space-y-4 font-poppins">
                      <p>
                        Someone confident and bubbly who doesn't need to be told what to do. You see something that needs doing, you do it. You've got an eye for the moment worth capturing. You're the kind of person strangers open up to. You'd rather be in the thick of it than watching from the side.
                      </p>
                      <p>
                        You'll need to be based in or around Northampton, or able to get yourself to events. Our DJs usually head out from Northampton, so you can travel with them if that works better.
                      </p>
                      <p>
                        We run events a couple of times a month, sometimes more. A mix of daytime and evening events. We'll be flexible where we can, but we need people we can count on.
                      </p>
                      <p>
                        Just bring energy, initiative, and the instinct to know when to hit record.
                      </p>
                    </div>
                  </section>

                  {/* This Isn't For Everyone */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">This Isn't For Everyone</h3>
                    <p className="text-muted-foreground leading-relaxed font-poppins">
                      If you need a lot of direction or prefer to blend into the background, this isn't your thing. But if you want to be part of something that sells out, surrounded by people having the time of their lives, we want to hear from you.
                    </p>
                  </section>

                  {/* CTA */}
                  <div className="pt-2">
                    <a 
                      href="mailto:hello@boomevents.co.uk?subject=Event%20Assistant%20Role"
                      className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors font-poppins text-lg"
                    >
                      Get In Touch
                    </a>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

        </div>
      </main>

      {/* Photo Gallery */}
      <PhotoGallery />

      {/* Video Section */}
      <section className="py-10 md:py-14 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bebas text-foreground mb-8">
              Here's What You'd Be Part Of
            </h2>
            <div className="video-container">
              <video 
                controls 
                playsInline 
                preload="none" 
                poster={videoThumbnail}
                className="w-full rounded-xl shadow-xl"
              >
                <source src={videoSource} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bebas text-foreground mb-4">Ready to Join Us?</h2>
            <p className="text-muted-foreground mb-6 font-poppins">Drop us an email and tell us why you'd be brilliant at this.</p>
            <a 
              href="mailto:hello@boomevents.co.uk?subject=Work%20With%20Boombastic"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors font-poppins"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Jobs;
