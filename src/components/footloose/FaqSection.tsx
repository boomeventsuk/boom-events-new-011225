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
      answer: "Wall-to-wall 80s anthems! From Madonna and Queen to Bon Jovi and Whitney Houston. Every song is a banger from the greatest decade in music - the songs you know every word to."
    },
    {
      question: "What time does it start and finish?",
      answer: "Doors open at 8pm and we party until midnight. Four hours of non-stop 80s anthems!"
    },
    {
      question: "Is there a dress code?",
      answer: "Come as you like! Whether you want to dress bright and bold in classic 80s style or keep it casual, you're welcome. The only requirement is to be ready to dance!"
    },
    {
      question: "What's the crowd like?",
      answer: "Everyone who loves 80s music! People who remember recording the Top 40, who know every word to 'Livin' on a Prayer', and who aren't afraid to get on the dancefloor. A friendly, fun crowd here to have a great time."
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
      answer: "Absolutely! FOOTLOOSE 80s is perfect for birthdays, reunions, and group nights out. Get in touch for group bookings or VIP packages."
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
