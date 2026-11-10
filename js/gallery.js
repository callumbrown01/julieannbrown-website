(async () => {
  const res = await fetch('data/gallery.json');
  const items = await res.json();
  const grid = document.getElementById('gallery-grid');
  const filterBar = document.getElementById('gallery-filters');

  // Build category filters with predefined order
  const validCategories = ['Portrait', 'Landscape + Waterwork', 'Creatures', 'Still Life + Botanical'];
  const categoriesInUse = new Set();

  items.forEach(item => {
    const itemCategories = Array.isArray(item.categories) ? item.categories : [item.categories || 'Landscape'];
    itemCategories.forEach(cat => categoriesInUse.add(cat));
  });

  const categories = ['All', ...validCategories.filter(c => categoriesInUse.has(c))];

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (cat === 'All') {
        renderGrid(items);
      } else {
        renderGrid(items.filter(i => {
          const itemCategories = Array.isArray(i.categories) ? i.categories : [i.categories || 'Landscape'];
          return itemCategories.includes(cat);
        }));
      }
    };
    filterBar.appendChild(btn);
  });

  function renderGrid(data) {
    grid.innerHTML = '';
    const images = [];
    let loadedCount = 0;

    // Create all elements first
    data.forEach(item => {
      const link = document.createElement('a');
      link.href = `painting.html?id=${item.id}&source=gallery`;
      link.className = 'gallery-item-link';

      const container = document.createElement('div');
      container.className = 'gallery-item';

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.title = item.title;

      images.push(img);

      // Track image loading
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          grid.classList.add('loaded');
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          grid.classList.add('loaded');
        }
      };

      container.appendChild(img);
      link.appendChild(container);
      grid.appendChild(link);
    });

    // If no images, show immediately
    if (images.length === 0) {
      grid.classList.add('loaded');
    }
  }

  renderGrid(items);
})();
