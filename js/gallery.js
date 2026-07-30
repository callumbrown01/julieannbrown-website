(async () => {
  const res = await fetch('data/gallery.json');
  const items = await res.json();
  const grid = document.getElementById('gallery-grid');
  const filterBar = document.getElementById('gallery-filters');

  // Build category filters with predefined order
  const validCategories = ['Landscape', 'Portrait', 'Creatures', 'Waterwork', 'Still Life'];
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
    data.forEach(item => {
      const container = document.createElement('div');
      container.className = 'gallery-item';
      
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
