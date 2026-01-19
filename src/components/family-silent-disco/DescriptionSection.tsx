interface DescriptionSectionProps {
  fullDescription: string;
}

export const DescriptionSection = ({ fullDescription }: DescriptionSectionProps) => {
  // Split description into paragraphs
  const paragraphs = fullDescription.split('\n\n').filter(p => p.trim());
  
  return (
    <section className="py-10 md:py-14 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              🎧 How It Works
            </h2>
          </div>
          
          <div className="space-y-6">
            {paragraphs.map((paragraph, index) => {
              // First paragraph gets special hook styling
              if (index === 0) {
                return (
                  <p
                    key={index}
                    className="text-xl md:text-2xl font-medium text-center text-foreground/90 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                );
              }
              
              // Check for pull quote pattern (text in quotes or specific phrases)
              const isPullQuote = paragraph.includes('Same dance floor') || 
                                  paragraph.includes('Same moment') ||
                                  paragraph.startsWith('"') ||
                                  paragraph.includes('Everyone finds their');
              
              if (isPullQuote) {
                return (
                  <blockquote
                    key={index}
                    className="border-l-4 border-primary pl-6 py-2 my-8 italic text-lg text-primary/90"
                  >
                    "{paragraph.replace(/"/g, '')}"
                  </blockquote>
                );
              }
              
              // Check for age info pattern
              const isAgeInfo = paragraph.toLowerCase().includes('perfect for kids') ||
                               paragraph.toLowerCase().includes('ages') ||
                               paragraph.toLowerCase().includes('4+');
              
              if (isAgeInfo) {
                return (
                  <div
                    key={index}
                    className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center"
                  >
                    <p className="text-lg text-foreground/90">
                      👨‍👩‍👧‍👦 {paragraph}
                    </p>
                  </div>
                );
              }
              
              // Regular paragraph
              return (
                <p
                  key={index}
                  className="text-lg text-foreground/80 leading-relaxed text-center"
                >
                  {paragraph}
                </p>
              );
            })}
          </div>
          
          {/* Static pull quote if not found in description */}
          {!paragraphs.some(p => p.includes('Same dance floor')) && (
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 italic text-lg text-primary/90 text-center">
              "Same dance floor. Same moment. Everyone's on their perfect soundtrack."
            </blockquote>
          )}
        </div>
      </div>
    </section>
  );
};
