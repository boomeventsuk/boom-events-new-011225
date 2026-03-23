interface HighlightsSectionProps {
  highlights: string;
}

export const HighlightsSection = ({ highlights }: HighlightsSectionProps) => {
  const items = highlights.split('|').map(h => {
    const parts = h.split(':');
    const emoji = parts[0]?.match(/^[^\s]+/)?.[0] || '🎉';
    const title = parts[0]?.replace(/^[^\s]+\s*/, '').trim() || '';
    const description = parts.slice(1).join(':').trim();
    return { emoji, title, description };
  });

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          🎉 WHAT MAKES BOOMBASTIC 90s SPECIAL
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-card/50 border border-border/30 rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{item.emoji}</span>
                <div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-foreground/80">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
