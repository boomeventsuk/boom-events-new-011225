interface VideoSectionProps {
  isChristmas?: boolean;
}

export const VideoSection = ({ isChristmas = false }: VideoSectionProps) => {
  // Video assets configuration
  const videoAssets = isChristmas 
    ? {
        poster: 'https://res.cloudinary.com/dteowuv7o/image/upload/v1764581303/CHRISTMAS_2PM_VID_WEB_thumbnail_mzaalk.png',
        source: 'https://res.cloudinary.com/dteowuv7o/video/upload/v1764581448/CHRISTMAS_2PM_VID_WEB_v2_tnraj9.mov'
      }
    : {
        poster: 'https://res.cloudinary.com/dteowuv7o/image/upload/v1764280330/WEB_VID_THUMBNAIL_i8cg1s.png',
        source: 'https://res.cloudinary.com/dteowuv7o/video/upload/v1764279993/2PM_video_low_res_aihmi0.mp4'
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
