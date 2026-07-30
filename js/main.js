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
})();