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
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.title = item.title;
      grid.appendChild(img);
    });
  }

  renderGrid(items);
})();