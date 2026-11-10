(async () => {
  const res = await fetch('data/gallery.json');
  const galleryItems = await res.json();

  // Slideshow on hero - display specific images in order
  const slidesContainer = document.querySelector('.slides');

  if (slidesContainer && galleryItems.length > 0) {
    // Define the 11 images to display on home page in specific order
    // Can add positioning config: { crop: 'bottom' | 'top' | 'center', zoom: number }
    const homePageImages = [
      { title: "Stillwater" },
      { title: "Watertank Mural", crop: "bottom" },
      { title: "The Beauty of Youth (Charli)", crop: "top-center" },
      { title: "LPP white frame Lounge" },
      { title: "Indjinup" },
      { title: "Pelican Landing" },
      { title: "Python Pool" },
      { title: "TahitianBlue" },
      { title: "TB white frame bath", crop: "top" },
      { title: "Billabong" }
    ];

    // Filter gallery items to only include home page images, maintaining order
    const slidesToShow = homePageImages
      .map(config => {
        const item = galleryItems.find(i => i.title === config.title);
        return item ? { ...item, ...config } : null;
      })
      .filter(item => item !== undefined);

    let currentSlide = 0;

    // Create slide elements
    slidesToShow.forEach((item, index) => {
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;

      // Add data attributes for CSS positioning
      if (item.crop) {
        img.dataset.crop = item.crop;
      }
      if (item.zoom) {
        img.dataset.zoom = item.zoom;
      }

      slide.appendChild(img);
      slidesContainer.appendChild(slide);
    });

    // Auto-rotate slides every 5 seconds
    setInterval(() => {
      const slides = document.querySelectorAll('.slide');

      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000);
  }
})();