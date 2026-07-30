(async () => {
  const res = await fetch('data/gallery.json');
  const galleryItems = await res.json();

  // Slideshow on hero
  const slidesContainer = document.querySelector('.slides');
  if (slidesContainer && galleryItems.length > 0) {
    let currentSlide = 0;

    // Create slide elements
    galleryItems.slice(0, 8).forEach((item, index) => {
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `<img src="${item.src}" alt="${item.title}" />`;
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

  // Featured grid
  const grid = document.getElementById('featured-grid');
  if (grid) {
    const featured = galleryItems.filter(item => item.featured).slice(0, 12);
    const items = featured.length > 0 ? featured : galleryItems.slice(0, 12);

    items.forEach(item => {
      const container = document.createElement('div');
      container.className = 'gallery-item';
      if (item.dimensions?.width && item.dimensions?.height) {
        const aspectRatio = item.dimensions.width / item.dimensions.height;
        container.style.aspectRatio = aspectRatio.toString();
      }
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      container.appendChild(img);
      grid.appendChild(container);
    });
  }
})();