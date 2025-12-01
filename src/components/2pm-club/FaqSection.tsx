import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export const FaqSection = () => {
  const faqs = [
    {
      question: "Is it really like a night out clubbing in the afternoon?",
      answer: "Absolutely! We've got professional sound systems, club lighting, confetti cannons, and DJs who know how to work a crowd. The only difference is the time — and the fact you'll actually remember it all."
    },
    {
      question: "What music will be played?",
      answer: "80s, 90s, and 00s classics that everyone knows every word to. Think Spice Girls, Oasis, OutKast, Whitney Houston, Vengaboys, and everything in between. Pure singalong anthems from start to finish."
    },
    {
      question: "Why do you start at 2pm?",
      answer: "Because it's the sweet spot! Late enough to have a leisurely morning, early enough to be home by 7pm. You get all the fun of a night out without sacrificing your Sunday or Monday."
    },
    {
      question: "Do you offer group tickets?",
      answer: "Yes! Groups of 10+ can get special rates. Contact us through Facebook or check the Eventbrite page for group booking options. Perfect for birthdays, hen dos, or just getting the squad together."
    },
    {
      question: "What's the crowd like?",
      answer: "A brilliant mix of people who love a good time but also appreciate being home at a reasonable hour. Ages typically range from late 20s to 50s+, but everyone's welcome. It's all about the vibes, not the demographics!"
    },
    {
      question: "What should I wear?",
      answer: "Whatever makes you feel fabulous! Some people go full night-out glam, others keep it casual. There's no dress code — just bring your dancing shoes and good energy."
    },
    {
      question: "What time do doors open and when does it finish?",
      answer: "Doors open at 2pm sharp, and we party until 6pm. Four solid hours of non-stop dancing, singalongs, and confetti moments. You'll be home in time for dinner!"
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
                <AccordionTrigger className="text-left hover:no-underline py-4">
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
