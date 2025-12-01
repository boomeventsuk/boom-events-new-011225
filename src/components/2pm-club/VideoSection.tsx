export const VideoSection = () => {
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
            poster="https://res.cloudinary.com/dteowuv7o/image/upload/v1764280330/WEB_VID_THUMBNAIL_i8cg1s.png"
            className="w-full rounded-xl shadow-xl"
          >
            <source
              src="https://res.cloudinary.com/dteowuv7o/video/upload/v1764279993/2PM_video_low_res_aihmi0.mp4"
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
