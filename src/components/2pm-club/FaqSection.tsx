import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export const FaqSection = () => {
  const faqs = [
    {
      question: "Is it really like a night out clubbing in the afternoon?",
      answer: "Yes. Club-level production, proper sound system, lighting, confetti moments. But you're done by 6pm and you'll actually feel good the next day. Same energy, better timing."
    },
    {
      question: "What music will be played?",
      answer: "80s, 90s and 00s anthems. Wall-to-wall songs you know every word to. The DJ builds the energy across the afternoon—starting with solid, accessible tracks and building toward peak moments. Think Whitney, Wham!, Spice Girls, Beyoncé, Take That, The Killers, Oasis."
    },
    {
      question: "Why do you start at 2pm?",
      answer: "Because it actually works with real life. You can have lunch with friends, run errands, whatever. You're done by 6pm, home by 7pm. You get a proper night out without sacrificing your Sunday or disrupting your week. That's the whole point."
    },
    {
      question: "Do you offer group tickets?",
      answer: "Yes. We offer group tickets for groups of four or more. People come to celebrate all sorts—birthdays, hen dos, work dos. But honestly, you don't need an excuse. The biggest thing is getting your friends together for a proper afternoon out. That's what this is for."
    },
    {
      question: "What's the crowd like?",
      answer: "Predominantly female, predominantly over 30. Everyone's welcome. Everyone's here for the same reason—to have a proper afternoon out with good music and good people. The atmosphere is genuinely welcoming."
    },
    {
      question: "What should I wear?",
      answer: "Whatever makes you feel good. Smart casual works perfectly – think the outfit you'd wear out for a nice afternoon. If you're planning to dance a lot, comfy shoes are your friend. Dress code is just to feel good."
    },
    {
      question: "What time do doors open and when does it finish?",
      answer: "Doors open at 2pm. Event runs until 6pm. You can arrive anytime after 2pm."
    }
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card/50 border border-border/30 rounded-2xl p-6 md:p-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Questions People Ask Before They Book
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`faq-${i}`}
                className="border border-border/20 rounded-lg px-6 bg-muted/20"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 uppercase">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/70 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 pt-6 border-t border-border/30 text-center">
            <p className="text-sm text-foreground/60 mb-6">
              This event is 18+ recommended unless stated otherwise.
            </p>
            <Button variant="outline" asChild>
              <a href="/">← Back to all events</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
