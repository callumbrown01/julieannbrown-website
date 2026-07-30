(async () => {
  const res = await fetch('data/gallery.json');
  const items = await res.json();
  const grid = document.getElementById('gallery-grid');
  const filterBar = document.getElementById('gallery-filters');

  // Build category filters
  const categories = ['All', ...new Set(items.map(i => i.category))];
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(cat === 'All' ? items : items.filter(i => i.category === cat));
    };
    filterBar.appendChild(btn);
  });

  function renderGrid(data) {
    grid.innerHTML = '';
    data.forEach(item => {
      // Create container for maintaining aspect ratio
      const container = document.createElement('div');
      container.className = 'gallery-item';
      
      // Set aspect ratio if dimensions available
      if (item.dimensions && item.dimensions.width && item.dimensions.height) {
        const aspectRatio = item.dimensions.width / item.dimensions.height;
        container.style.aspectRatio = aspectRatio.toString();
      } else {
        // Default aspect ratio if no dimensions
        container.style.aspectRatio = '1';
      }
      
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.title = item.title;
      
      container.appendChild(img);
      grid.appendChild(container);
    });
  }

  renderGrid(items);
})();