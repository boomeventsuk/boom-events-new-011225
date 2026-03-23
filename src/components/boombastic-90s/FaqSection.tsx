import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const FaqSection = () => {
  const faqs = [
    {
      question: "What kind of music will be played?",
      answer: "All of the 90s! Pop perfection from the Spice Girls, Britpop anthems from Oasis and Blur, dance floor euphoria from Faithless and Robin S, hip-hop swagger from TLC and Will Smith — the whole decade, no filler."
    },
    {
      question: "What time does it start and finish?",
      answer: "Doors open at 8:30pm and we party until 12:30am. Four hours of non-stop 90s anthems!"
    },
    {
      question: "Is there a dress code?",
      answer: "Come as you are! Whether you want to channel your inner Spice Girl or keep it casual, you're welcome. The only requirement is to be ready to sing every word."
    },
    {
      question: "What's the crowd like?",
      answer: "Everyone who loves 90s music! People who picked a side between Blur and Oasis, who know every word to Wannabe, and who remember exactly where they were when they first heard Show Me Love. A friendly, fun crowd here to have a great time."
    },
    {
      question: "Can I buy tickets on the door?",
      answer: "We recommend booking in advance as our events often sell out. If tickets are still available on the day, you can pay on the door, but we can't guarantee availability."
    },
    {
      question: "Is it accessible?",
      answer: "Yes! The Picturedrome has full accessibility. If you have specific requirements, please contact us in advance and we'll do everything we can to help."
    },
    {
      question: "Can I book for a group or birthday?",
      answer: "Absolutely! BOOMBASTIC 90s is perfect for birthdays, reunions, and group nights out. Get in touch for group bookings or VIP packages."
    }
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h2>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card/50 border border-border/30 rounded-xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-semibold hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-10 text-center">
            <Link to="/">
              <Button variant="outline" size="lg">
                ← Back to all events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
