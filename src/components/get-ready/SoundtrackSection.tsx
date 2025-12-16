interface SoundtrackSectionProps {
  soundtrack: string;
}

export const SoundtrackSection = ({ soundtrack }: SoundtrackSectionProps) => {
  // Split the soundtrack string into individual artists
  const artists = soundtrack.split(' · ').map(a => a.trim());

  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-amber-500/10 to-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🎵 THE LEGENDS
          </h2>
          <p className="text-lg text-foreground/80 mb-8">
            The Motown, Soul & Disco icons who created the soundtrack to a generation 🕺
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {artists.map((artist, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-card/80 border border-amber-500/30 rounded-full text-sm md:text-base font-medium hover:bg-amber-500/20 hover:border-amber-500 transition-colors cursor-default"
              >
                {artist}
              </span>
            ))}
          </div>
          
          <p className="mt-8 text-foreground/60 text-sm">
            ...and many more legendary floorfillers!
          </p>
        </div>
      </div>
    </section>
  );
};
