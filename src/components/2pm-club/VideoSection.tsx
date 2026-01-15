export const VideoSection = () => {
  const videoAssets = {
    poster: 'https://boombastic-events.b-cdn.net/2PM%20web%20videos/2PM%20Web%20Video%20Thumbnail.jpg',
    source: 'https://boombastic-events.b-cdn.net/2PM%20web%20videos/2PM%20video%20low%20res.mp4'
  };

  return (
    <section className="py-10 md:py-14 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            See What You're Missing
          </h2>
          <div className="video-container">
            <video
              controls
              playsInline
              preload="none"
              poster={videoAssets.poster}
              className="w-full rounded-xl shadow-xl"
            >
              <source
                src={videoAssets.source}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};
