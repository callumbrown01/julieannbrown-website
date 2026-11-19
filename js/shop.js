(async () => {
  const res = await fetch('data/shop.json');
  const allItems = await res.json();
  const grid = document.getElementById('shop-grid');

  // Filter out items with $0 price
  const items = allItems.filter(item => item.price && item.price > 0);

  // Sort: unsold first, then by order
  items.sort((a, b) => {
    if (a.sold !== b.sold) {
      return a.sold ? 1 : -1; // unsold items (false) come first
    }
    return a.order - b.order;
  }).forEach(item => {
    const link = document.createElement('a');
    link.href = `painting.html?id=${item.id}&source=shop`;
    link.className = 'shop-item-link';

    const card = document.createElement('div');
    card.className = 'shop-item';

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'shop-item-image';

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title;
    imgWrapper.appendChild(img);

    const info = document.createElement('div');
    info.className = 'shop-item-info';
    
    if (item.sold) {
      info.innerHTML = `
        <div class="shop-item-title-bar">
          <h3>${item.title}</h3>
          <span class="sold-dot" title="Sold"></span>
        </div>`;
    } else {
      info.innerHTML = `
        <div class="shop-item-title-bar">
          <h3>${item.title}</h3>
          <button class="btn-price-details">$${item.price.toLocaleString()} <span class="btn-arrow">→</span></button>
        </div>`;
    }

    card.appendChild(imgWrapper);
    card.appendChild(info);
    link.appendChild(card);
    grid.appendChild(link);
  });
})();