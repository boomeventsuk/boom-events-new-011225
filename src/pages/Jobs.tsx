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
  const [assistantOpen, setAssistantOpen] = useState(true);

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
            We're Boombastic. Since 2014, we've thrown over 250 music events across the Midlands. We're building a small pool of reliable helpers to support the team at our events.
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
                    Good rate of pay | Weekends | Northampton, Bedford, Coventry, Milton Keynes, Luton, Leicester & beyond
                  </p>
                </div>
                <ChevronDown className={`h-6 w-6 text-primary shrink-0 transition-transform duration-300 ${djOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                  
                  {/* About */}
                  <section>
                    <p className="text-muted-foreground leading-relaxed font-poppins">
                      Boombastic Events runs ticketed music events across the Midlands, Northampton, Bedford, Coventry, Milton Keynes, Luton, and Leicester, with more locations planned. Our events are predominantly daytime (Saturday afternoons, 2pm–6pm) but we also run evening events (usually 4 hours, between 8pm and 1am).
                    </p>
                    <p className="text-muted-foreground leading-relaxed font-poppins mt-4">
                      The music is iconic 80s, 90s and 00s pop anthems, think Spice Girls, ABBA, Whitney Houston, Bon Jovi, Oasis, Take That, Beyoncé, Madonna, The Killers, Robbie Williams, Gloria Gaynor. Every track is a singalong. The crowd knows every word, and the energy in the room reflects that.
                    </p>
                  </section>

                  {/* What We're Looking For */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">What We're Looking For</h3>
                    <ul className="text-muted-foreground leading-relaxed font-poppins space-y-3">
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Strong on the mic, you're the host of the room, not just pressing play</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Comfortable working with structured playlists, the music and flow are provided, you bring the energy and delivery</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Reads the room, knowing when to hype it up and when to let the crowd carry the moment</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Reliable and consistent, we run across multiple locations and the experience needs to be the same everywhere</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Video DJing experience is a plus but not essential, we can walk you through our setup</li>
                    </ul>
                  </section>

                  {/* The Logistics */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">The Logistics</h3>
                    <ul className="text-muted-foreground leading-relaxed font-poppins space-y-3">
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> 4-hour sets with setup and packdown either side</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> We provide additional lighting and, where possible, music on a laptop for video DJing</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Kit is collected from and returned to our offices in Northampton (10 mins from J15/J15A, M1), flexible on timing, whether that's the day before or the Monday after</li>
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
                    Event Assistant - Casual Event Work
                  </h2>
                  <p className="text-muted-foreground font-poppins text-sm md:text-base">
                    Up to £15/hour | Daytime and evening shifts | Northampton and surrounding areas
                  </p>
                  <p className="text-muted-foreground font-poppins text-sm mt-1">
                    No event experience needed. You just need to be reliable, practical and happy to help.
                  </p>
                </div>
                <ChevronDown className={`h-6 w-6 text-primary shrink-0 transition-transform duration-300 ${assistantOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">

                  {/* Role intro */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">The Role</h3>
                    <div className="text-muted-foreground leading-relaxed space-y-4 font-poppins">
                      <p>
                        We are looking for a few reliable people who can help at Boombastic events on a casual basis. Some shifts are daytime, some are evenings, and most are at weekends.
                      </p>
                      <p>
                        This is not guaranteed weekly work. When we have events that fit your availability, we offer them out to the team. It suits someone who wants occasional paid event work and is happy being a useful extra pair of hands.
                      </p>
                    </div>
                  </section>

                  {/* What You'll Do */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">What You'll Do</h3>
                    <ul className="text-muted-foreground leading-relaxed font-poppins space-y-3">
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Help load in, set up and pack away event kit</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Set up simple event kit, signage, headphones, lights or check-in areas</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Scan tickets or help guests check in at the door</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Welcome guests and answer simple questions</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Help with queues, wristbands, room flow or small venue tasks</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Take a few short video clips during the event if needed</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Help the DJ or event lead with practical jobs</li>
                    </ul>
                  </section>

                  {/* Who We're Looking For */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">Who We're Looking For</h3>
                    <div className="text-muted-foreground leading-relaxed space-y-4 font-poppins">
                      <p>
                        You might be a student, a hospitality person, a venue worker, someone with a bit of retail, stewarding or customer service experience, or just someone local who is friendly and useful in busy rooms.
                      </p>
                      <p>
                        You need to be reliable, practical and willing to get stuck in. You are comfortable being on your feet, carrying kit, talking to guests and helping with the practical bits as well as the fun bits.
                      </p>
                      <p>
                        You do not need lots of event experience. We can show you how our events work. What matters most is that you turn up on time, listen, help and do the job properly.
                      </p>
                    </div>
                  </section>

                  {/* Practical Details */}
                  <section>
                    <h3 className="text-xl md:text-2xl font-bebas text-primary mb-3">The Practical Bits</h3>
                    <ul className="text-muted-foreground leading-relaxed font-poppins space-y-3">
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Up to £15 per hour, depending on experience and the type of shift</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Casual work, offered around the event calendar</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Daytime and evening events, mostly weekends</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Northampton and surrounding areas, with occasional wider Midlands events</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Driving is useful but not always essential</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> DBS may be needed for some family or community events</li>
                      <li className="flex gap-2"><span className="text-primary font-bold">•</span> Pay will always meet or exceed the legal minimum for your age</li>
                    </ul>
                  </section>

                  {/* CTA */}
                  <div className="pt-2">
                    <a 
                      href="mailto:hello@boomevents.co.uk?subject=Events%20Assistant%20Role"
                      className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors font-poppins text-lg"
                    >
                      Apply For Events Assistant Work
                    </a>
                    <p className="text-muted-foreground leading-relaxed font-poppins text-sm mt-3">
                      Tell us where you are based, your general availability and why you think you would be good at this.
                    </p>
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
            <p className="text-muted-foreground mb-6 font-poppins">Drop us an email with where you are based, when you are generally free and why this sounds like you.</p>
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
