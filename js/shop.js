(async () => {
  const res = await fetch('data/shop.json');
  const allItems = await res.json();
  const grid = document.getElementById('shop-grid');

  // Filter out items with $0 price
  const items = allItems.filter(item => item.price && item.price > 0);

  items.sort((a, b) => a.order - b.order).forEach(item => {
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
      <p class="price">$${item.price.toLocaleString()} AUD</p>
      ${item.sold
        ? `<span class="sold-badge">Sold</span>`
        : `<a class="btn" href="${item.stripeLink}" target="_blank">Buy Now</a>`}`;

    card.appendChild(imgWrapper);
    card.appendChild(info);
    grid.appendChild(card);
  });
})();