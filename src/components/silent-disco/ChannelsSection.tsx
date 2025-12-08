import { SilentDiscoChannel } from '@/components/SilentDiscoEventPage';

interface ChannelsSectionProps {
  channels: SilentDiscoChannel[];
}

const channelStyles = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-l-blue-500',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-l-green-500',
    text: 'text-green-400',
    glow: 'shadow-green-500/20',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-l-red-500',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
};

export const ChannelsSection = ({ channels }: ChannelsSectionProps) => {
  return (
    <section className="py-10 md:py-14 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              THREE CHANNELS. YOUR CHOICE.
            </h2>
            <p className="text-lg text-foreground/70">
              Switch between them all night. Your headphones, your rules.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {channels.map((channel) => {
              const styles = channelStyles[channel.color];
              return (
                <div
                  key={channel.name}
                  className={`${styles.bg} ${styles.border} border-l-4 rounded-xl p-6 shadow-lg ${styles.glow} hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🎧</span>
                    <h3 className={`text-xl font-bold ${styles.text}`}>
                      {channel.name}
                    </h3>
                  </div>
                  <p className="text-foreground/80">
                    {channel.artists}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
