(async () => {
  const res = await fetch('data/gallery.json');
  const items = await res.json();
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  items.filter(i => i.featured).slice(0, 4).forEach(item => {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title;
    grid.appendChild(img);
  });
})();