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
    info.innerHTML = `
      <h3>${item.title}</h3>
      <p class="medium">${item.medium}</p>
      ${!item.sold ? `<p class="price">$${item.price.toLocaleString()} AUD</p>` : ''}
      ${item.sold
        ? `<span class="sold-badge">Sold</span>`
        : `<span class="btn">View Details</span>`}`;

    card.appendChild(imgWrapper);
    card.appendChild(info);
    link.appendChild(card);
    grid.appendChild(link);
  });
})();