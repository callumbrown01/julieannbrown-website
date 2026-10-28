(async () => {
  // Get the painting ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const paintingId = urlParams.get('id');
  const source = urlParams.get('source') || 'gallery'; // 'gallery' or 'shop'

  if (!paintingId) {
    document.getElementById('painting-title').textContent = 'Painting not found';
    return;
  }

  // Fetch the appropriate data source
  const dataFile = source === 'shop' ? 'data/shop.json' : 'data/gallery.json';
  const res = await fetch(dataFile);
  const items = await res.json();

  // Find the painting
  const painting = items.find(item => item.id === paintingId);

  if (!painting) {
    document.getElementById('painting-title').textContent = 'Painting not found';
    return;
  }

  // Update page title
  document.getElementById('page-title').textContent = `${painting.title} — Julie-Ann Brown`;

  // Set back link
  const backLink = document.getElementById('back-link');
  backLink.href = source === 'shop' ? 'shop.html' : 'gallery.html';

  // Populate image
  const image = document.getElementById('painting-image');
  image.src = painting.src;
  image.alt = painting.title;

  // Populate title
  document.getElementById('painting-title').textContent = painting.title;

  // Populate details
  const detailsContainer = document.getElementById('painting-details');
  let detailsHTML = '';

  if (painting.categories) {
    const categories = Array.isArray(painting.categories) ? painting.categories : [painting.categories];
    detailsHTML += `<p class="painting-category"><strong>Category:</strong> ${categories.join(', ')}</p>`;
  }

  if (painting.medium) {
    detailsHTML += `<p class="painting-medium"><strong>Details:</strong> ${painting.medium}</p>`;
  }

  if (painting.dimensions) {
    detailsHTML += `<p class="painting-dimensions"><strong>Dimensions:</strong> ${painting.dimensions.width} x ${painting.dimensions.height}cm</p>`;
  }

  detailsContainer.innerHTML = detailsHTML;

  // Populate purchase section (only for shop items)
  const purchaseSidebar = document.getElementById('purchase-sidebar');
  if (source === 'shop' && painting.price) {
    let purchaseHTML = '<div class="purchase-content">';

    if (!painting.sold) {
      purchaseHTML += `<p class="painting-price">$${painting.price.toLocaleString()} AUD</p>`;
      if (painting.stripeLink) {
        purchaseHTML += `<a href="${painting.stripeLink}" target="_blank" class="btn btn-primary">Buy Now</a>`;
      }
    } else {
      purchaseHTML += '<span class="sold-badge-large">Sold</span>';
    }

    purchaseHTML += '</div>';
    purchaseSidebar.innerHTML = purchaseHTML;
  } else if (source === 'gallery') {
    purchaseSidebar.innerHTML = '<div class="purchase-content"><p class="gallery-note">This painting is in the gallery collection.</p></div>';
  }
})();
