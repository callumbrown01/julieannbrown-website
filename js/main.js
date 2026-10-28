function highlightCurrentPage() {
  const navLinks = document.querySelectorAll('.nav-menu a');
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Check if the link href matches the current page
    if (currentPath.endsWith(href) || 
        (currentPath.endsWith('/') && href === 'index.html')) {
      link.classList.add('current-page');
    }
  });
}

(async () => {
  const res = await fetch('data/gallery.json');
  const galleryItems = await res.json();

  // Slideshow on hero
  const slidesContainer = document.querySelector('.slides');
  const thumbnailsContainer = document.querySelector('.slideshow-thumbnails');

  if (slidesContainer && galleryItems.length > 0) {
    let currentSlide = 0;
    const slidesToShow = galleryItems.slice(0, 8);

    // Create slide elements and thumbnails
    slidesToShow.forEach((item, index) => {
      // Create slide
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `<img src="${item.src}" alt="${item.title}" />`;
      slidesContainer.appendChild(slide);

      // Create thumbnail
      const thumbnail = document.createElement('div');
      thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.innerHTML = `<img src="${item.src}" alt="${item.title}" />`;
      thumbnail.addEventListener('click', () => goToSlide(index));
      thumbnailsContainer.appendChild(thumbnail);
    });

    function goToSlide(index) {
      const slides = document.querySelectorAll('.slide');
      const thumbnails = document.querySelectorAll('.thumbnail');

      slides[currentSlide].classList.remove('active');
      thumbnails[currentSlide].classList.remove('active');

      currentSlide = index;

      slides[currentSlide].classList.add('active');
      thumbnails[currentSlide].classList.add('active');
    }

    // Auto-rotate slides every 5 seconds
    setInterval(() => {
      const slides = document.querySelectorAll('.slide');
      const thumbnails = document.querySelectorAll('.thumbnail');

      slides[currentSlide].classList.remove('active');
      thumbnails[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
      thumbnails[currentSlide].classList.add('active');
    }, 5000);
  }

  // Highlight current page in navigation
  highlightCurrentPage();
})();