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
          </div>
        </div>
      </div>
    </section>
  );
};
