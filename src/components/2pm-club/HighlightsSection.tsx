interface HighlightsSectionProps {
  highlights: string;
  isChristmas?: boolean;
}

export const HighlightsSection = ({ highlights, isChristmas = false }: HighlightsSectionProps) => {
  const parsedHighlights = highlights.split('|').map(h => {
    const colonIndex = h.indexOf(':');
    if (colonIndex === -1) return { title: '', description: '' };
    
    const title = h.substring(0, colonIndex).trim();
    const description = h.substring(colonIndex + 1).trim();
    
    return { title, description };
  }).filter(h => h.title && h.description);

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            {isChristmas ? "Why This Beats Every Other Christmas Do" : "Why Daytime Discos Are a Game Changer!"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {parsedHighlights.map((highlight, i) => (
              <div
                key={i}
                className="bg-card/50 border border-border/30 rounded-xl p-6 hover:border-primary/30 transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-2">
                  {highlight.title}
                </h3>
                <p className="text-foreground/70">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
