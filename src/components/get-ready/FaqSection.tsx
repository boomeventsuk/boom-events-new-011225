import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "What kind of music will be played?",
    answer: "Our DJs will play four hours of the biggest Motown, Soul and Disco floorfillers from the 60s and 70s. Think The Jackson 5, Stevie Wonder, Diana Ross, Chic, Sister Sledge, James Brown, The Four Tops, The Temptations and many more legends."
  },
  {
    question: "What time does it start and finish?",
    answer: "GET READY runs from 2pm to 6pm - a perfect Sunday afternoon! You'll be home in time for dinner with plenty of energy left for the week ahead."
  },
  {
    question: "Is there a dress code?",
    answer: "No strict dress code, but we love seeing 60s and 70s inspired outfits! Afros, flares, disco collars - or just come as you are. The most important thing is comfortable dancing shoes!"
  },
  {
    question: "Can I buy tickets on the door?",
    answer: "We recommend booking online now — only 50 tickets remain! Tickets are £7.50 each. This event often sells out completely."
  },
  {
    question: "Is the venue accessible?",
    answer: "The Picturedrome has step-free access and accessible facilities. Please contact the venue directly if you have specific accessibility requirements."
  },
  {
    question: "Can I get a refund if I can't make it?",
    answer: "Tickets are handled through Eventbrite. Please check Eventbrite's refund policy when booking, or contact us directly and we'll do our best to help."
  }
];

export const FaqSection = () => {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/30 rounded-lg px-4 bg-card/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-10 text-center">
            <Link to="/#events">
              <Button variant="outline" className="border-amber-500/50 hover:bg-amber-500/10">
                ← Back to all events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
