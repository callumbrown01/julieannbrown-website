(async () => {
  const res = await fetch('data/shop.json');
  const items = await res.json();
  const grid = document.getElementById('shop-grid');

  items.sort((a, b) => a.order - b.order).forEach(item => {
    const card = document.createElement('div');
    card.className = 'shop-item';
    card.innerHTML = `
      <img src="${item.src}" alt="${item.title}" />
      <div class="shop-item-info">
        <h3>${item.title}</h3>
        <p class="medium">${item.medium}</p>
        <p class="price">$${item.price.toLocaleString()} AUD</p>
        ${item.sold
          ? `<span class="sold-badge">Sold</span>`
          : `<a class="btn" href="${item.stripeLink}" target="_blank">Buy Now</a>`}
      </div>`;
    grid.appendChild(card);
  });
})();