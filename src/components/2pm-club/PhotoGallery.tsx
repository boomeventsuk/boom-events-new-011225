export const PhotoGallery = () => {
  const photos = [
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268387/2pm_web_1_ndjab4.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268387/2pm_web_2_qedzzq.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268387/2pm_web_3_nuwrvk.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268386/2pm_web_4_j87ixj.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268386/2pm_web_5_eln7gp.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268386/2pm_web_6_bjt6h7.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1764268389/2pm_web_7_jl6yvd.jpg'
  ];

  // Double the array for seamless infinite scroll
  const allPhotos = [...photos, ...photos];

  return (
    <section className="py-10 md:py-14 overflow-hidden bg-muted/10">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          The Vibe In Pictures
        </h2>
      </div>
      
      <div className="relative">
        <div className="flex gallery-scroll gap-4">
          {allPhotos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`2PM Club gallery photo ${(i % photos.length) + 1}`}
              className="w-64 md:w-80 h-48 md:h-60 object-cover rounded-xl flex-shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
