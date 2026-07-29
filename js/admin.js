// ─── CONFIG ───────────────────────────────────────────────────────
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME';
const GITHUB_REPO = 'julieannbrown-website';
const GITHUB_TOKEN = 'https://callumbrown01.github.io/julieannbrown-website/contact.html';
const CLOUDINARY_CLOUD = 'fqtug4al';
const CLOUDINARY_PRESET = 'julieannbrown-website';
const ADMIN_PASSWORD_HASH = 'c9374488070ef72bbc2b6a766efe60e2af03f27ac5d09d3e0fee87337a6ef928'; // hash of password

// ─── LOGIN ────────────────────────────────────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkLogin() {
  const pwd = document.getElementById('pwd-input').value;
  const hash = await sha256(pwd);
  if (hash === ADMIN_PASSWORD_HASH) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminData();
  } else {
    document.getElementById('login-error').textContent = 'Incorrect password.';
  }
}

// ─── DATA ─────────────────────────────────────────────────────────
let galleryData = [];
let shopData = [];

async function fetchJSON(file) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/${file}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const json = await res.json();
  return { data: JSON.parse(atob(json.content)), sha: json.sha };
}

async function loadAdminData() {
  const g = await fetchJSON('gallery.json');
  galleryData = g.data;
  const s = await fetchJSON('shop.json');
  shopData = s.data;
  renderAdminGallery();
  renderAdminShop();
}

// ─── CLOUDINARY UPLOAD ────────────────────────────────────────────
async function uploadToCloudinary(file, folder) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
  const json = await res.json();
  return json.secure_url;
}

// ─── GALLERY ──────────────────────────────────────────────────────
async function uploadGalleryImage() {
  const file = document.getElementById('gallery-file').files[0];
  const title = document.getElementById('gallery-title').value;
  const category = document.getElementById('gallery-category').value;
  const featured = document.getElementById('gallery-featured').checked;
  if (!file || !title) return alert('Please select a file and enter a title.');
  const url = await uploadToCloudinary(file, 'gallery');
  galleryData.push({ id: 'g' + Date.now(), title, src: url, category, featured });
  renderAdminGallery();
}

function renderAdminGallery() {
  const list = document.getElementById('gallery-admin-list');
  list.innerHTML = '';
  galleryData.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'admin-thumb';
    div.innerHTML = `<img src="${item.src}" alt="${item.title}" title="${item.title}" />
      <button class="remove-btn" onclick="removeGalleryItem(${i})">×</button>`;
    list.appendChild(div);
  });
}

function removeGalleryItem(i) {
  if (!confirm('Remove this image?')) return;
  galleryData.splice(i, 1);
  renderAdminGallery();
}

// ─── SHOP ─────────────────────────────────────────────────────────
async function uploadShopItem() {
  const file = document.getElementById('shop-file').files[0];
  const title = document.getElementById('shop-title').value;
  const price = parseFloat(document.getElementById('shop-price').value);
  const medium = document.getElementById('shop-medium').value;
  const stripeLink = document.getElementById('shop-stripe').value;
  if (!file || !title) return alert('Please select a file and enter a title.');
  const url = await uploadToCloudinary(file, 'shop');
  shopData.push({ id: 's' + Date.now(), title, src: url, price, medium, sold: false, stripeLink, order: shopData.length });
  renderAdminShop();
}

function renderAdminShop() {
  const list = document.getElementById('shop-admin-list');
  list.innerHTML = '';
  shopData.sort((a, b) => a.order - b.order).forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'admin-thumb';
    div.draggable = true;
    div.dataset.index = i;
    div.innerHTML = `<span class="drag-handle">⠿</span>
      <img src="${item.src}" alt="${item.title}" title="${item.title}" />
      <small style="display:block;text-align:center;margin-top:4px">${item.title}</small>
      <label style="display:block;text-align:center"><input type="checkbox" ${item.sold ? 'checked' : ''} onchange="toggleSold(${i}, this.checked)"> Sold</label>
      <button class="remove-btn" onclick="removeShopItem(${i})">×</button>`;
    div.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', i));
    div.addEventListener('drop', e => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = parseInt(div.dataset.index);
      const moved = shopData.splice(from, 1)[0];
      shopData.splice(to, 0, moved);
      shopData.forEach((item, idx) => item.order = idx);
      renderAdminShop();
    });
    list.appendChild(div);
  });
}

function removeShopItem(i) {
  if (!confirm('Remove this item from the shop?')) return;
  shopData.splice(i, 1);
  shopData.forEach((item, idx) => item.order = idx);
  renderAdminShop();
}

function toggleSold(i, val) {
  shopData[i].sold = val;
}

// ─── SAVE TO GITHUB ───────────────────────────────────────────────
async function saveChanges() {
  document.getElementById('save-status').textContent = 'Saving...';
  try {
    await saveFile('gallery.json', galleryData);
    await saveFile('shop.json', shopData);
    document.getElementById('save-status').textContent = '✅ Saved! Site will update in ~1 minute.';
  } catch (e) {
    document.getElementById('save-status').textContent = '❌ Error: ' + e.message;
  }
}

async function saveFile(file, data) {
  // Get current SHA
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/${file}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const current = await res.json();

  await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/${file}`, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Admin: update ${file}`,
      content: btoa(JSON.stringify(data, null, 2)),
      sha: current.sha
    })
  });
}