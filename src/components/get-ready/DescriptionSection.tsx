interface DescriptionSectionProps {
  event: {
    city: string;
    fullDescription: string;
  };
}

export const DescriptionSection = ({ event }: DescriptionSectionProps) => {
  // Split description into paragraphs
  const paragraphs = event.fullDescription.split('\n\n').filter(p => p.trim());

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              🎶 Relive the Golden Era
            </h2>
          </div>
          
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => (
              <p 
                key={index} 
                className={`text-lg leading-relaxed ${
                  index === 0 
                    ? 'text-xl font-medium text-foreground' 
                    : 'text-foreground/80'
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Pull quote */}
          <blockquote className="mt-10 border-l-4 border-amber-500 pl-6 py-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-r-lg">
            <p className="text-xl italic text-foreground/90">
              "The music that made you fall in love with dancing. The songs that defined an era. The afternoon that'll have you smiling for weeks."
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
};
