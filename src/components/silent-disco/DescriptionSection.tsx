import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DescriptionSectionProps {
  event: {
    title: string;
    location: string;
    fullDescription: string;
  };
}

export const DescriptionSection = ({ event }: DescriptionSectionProps) => {
  const paragraphs = event.fullDescription.split('\n\n');
  
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => {
              // Check if this is the "chaos" quote paragraph
              if (paragraph.includes('Pure chaos. Pure joy.')) {
                return (
                  <blockquote 
                    key={index}
                    className="border-l-4 border-primary pl-6 py-2 my-8"
                  >
                    <p className="text-xl md:text-2xl italic text-foreground/90">
                      {paragraph}
                    </p>
                  </blockquote>
                );
              }
              
              return (
                <p 
                  key={index} 
                  className={`text-lg ${index === 0 ? 'text-xl font-medium' : 'text-foreground/80'}`}
                >
                  {paragraph}
                </p>
              );
            })}
            {event.location.includes('Charles Bradlaugh') && (
              <Accordion type="single" collapsible>
                <AccordionItem value="access">
                  <AccordionTrigger>What is access like at The Charles Bradlaugh?</AccordionTrigger>
                  <AccordionContent>The event room is upstairs, accessed by steps. Toilets are available on both floors. For access questions, contact hello@boomevents.co.uk before booking.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="food">
                  <AccordionTrigger>Can we book food?</AccordionTrigger>
                  <AccordionContent>Food is served downstairs and booked separately from event tickets. Contact the venue on 01604 473225 or info@thecharlesbradlaugh.com for menus and table bookings.</AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
