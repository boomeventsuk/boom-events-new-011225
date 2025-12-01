export const PhotoGallery = () => {
  const photos = [
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-1.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-2.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-3.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-4.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-5.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-6.jpg',
    'https://res.cloudinary.com/dteowuv7o/image/upload/v1737207982/2pm-gallery-7.jpg'
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
