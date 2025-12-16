interface HighlightsSectionProps {
  highlights: string;
}

export const HighlightsSection = ({ highlights }: HighlightsSectionProps) => {
  // Parse highlights string: "emoji Title: Description|emoji Title: Description"
  const highlightItems = highlights.split('|').map(item => {
    const trimmed = item.trim();
    // Extract emoji (first character or two)
    const emojiMatch = trimmed.match(/^(\p{Emoji})/u);
    const emoji = emojiMatch ? emojiMatch[1] : '✨';
    const rest = trimmed.replace(/^\p{Emoji}\s*/u, '');
    
    // Split by first colon
    const colonIndex = rest.indexOf(':');
    if (colonIndex > -1) {
      return {
        emoji,
        title: rest.substring(0, colonIndex).trim(),
        description: rest.substring(colonIndex + 1).trim()
      };
    }
    return { emoji, title: rest, description: '' };
  });

  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why You'll Love It
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {highlightItems.map((item, index) => (
              <div
                key={index}
                className="p-6 bg-card/50 border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition-colors"
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="text-lg font-bold text-amber-400 mb-2">
                  {item.title}
                </h3>
                <p className="text-foreground/80 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
