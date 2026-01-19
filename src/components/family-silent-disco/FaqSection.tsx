import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "What ages is this suitable for?",
    answer: "Our Family Silent Disco is perfect for children aged 4 and above. Parents, grandparents, and carers are all welcome to join in the fun! With three channels of music, everyone from toddlers to teens (and adults!) will find something they love."
  },
  {
    question: "How do the headphones work?",
    answer: "Each person gets a pair of wireless headphones that connect to three different music channels. Simply switch between channels using the buttons on the headphones – it's so easy that even young children can do it! The headphones are lightweight and adjustable to fit all head sizes."
  },
  {
    question: "What music is played on each channel?",
    answer: "🔵 PARTY (Blue) – Kids' party hits including Disney favourites, Trolls, Moana, Baby Shark, YMCA, and more!\n🔴 THROWBACK (Red) – Classic anthems from the 80s, 90s & 00s that parents will love – Mr Brightside, Dancing Queen, Wannabe!\n🟢 CHART (Green) – Clean, recent chart and trending hits for tweens and teens."
  },
  {
    question: "What if my child doesn't like wearing headphones?",
    answer: "No pressure at all! Children can take breaks whenever they want, try different channels to find their favourite, or simply enjoy watching the fun. Many children who are initially hesitant end up loving it once they see everyone else dancing!"
  },
  {
    question: "Is food and drink available?",
    answer: "The venue bar will be open serving soft drinks, snacks, and refreshments. You're welcome to bring your own water bottles too."
  },
  {
    question: "What time should we arrive?",
    answer: "Doors open at 1:30pm with our Party Channel already playing to get everyone in the mood. The full 3-channel experience runs from 2pm to 4pm. We recommend arriving early to collect headphones and find your dancing spot!"
  },
  {
    question: "Can grandparents or other carers attend?",
    answer: "Absolutely! The more the merrier. Adult tickets are available for anyone who wants to join the dancing, and you'll be amazed – the grown-ups often have even more fun than the kids!"
  }
];

export const FaqSection = () => {
  return (
    <section className="py-10 md:py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              ❓ Frequently Asked Questions
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-card/50 border border-primary/20 rounded-xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 pb-4 whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
