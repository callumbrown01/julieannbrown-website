(async () => {
  const res = await fetch('data/gallery.json');
  const items = await res.json();
  const grid = document.getElementById('gallery-grid');
  const filterBar = document.getElementById('gallery-filters');

  // Build category filters with predefined order
  const validCategories = ['Landscape', 'Portrait', 'Creatures', 'Waterwork', 'Still Life'];
  const categoriesInUse = new Set(items.map(i => i.category));
  const categories = ['All', ...validCategories.filter(c => categoriesInUse.has(c))];
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
      const container = document.createElement('div');
      container.className = 'gallery-item';
      img.alt = item.title;
      img.title = item.title;

      container.appendChild(img);
      grid.appendChild(container);
    });
  }

  renderGrid(items);
})();