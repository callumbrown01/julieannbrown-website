// ─── CONFIG ───────────────────────────────────────────────────────
const GITHUB_OWNER = 'callumbrown01';
const GITHUB_REPO = 'julieannbrown-website';
const CLOUDINARY_CLOUD = 'fqtug4al';
const CLOUDINARY_PRESET = 'julieannbrown-website';
const ADMIN_PASSWORD_HASH = 'c9374488070ef72bbc2b6a766efe60e2af03f27ac5d09d3e0fee87337a6ef928'; // hash of password
const API_BASE = '/.netlify/functions';

// Store admin password for passing to serverless functions
let adminPassword = '';

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
    adminPassword = pwd; // Store for API calls
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
let workshopsData = [];

async function fetchJSON(file) {
  try {
    const res = await fetch(`${API_BASE}/github-fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();
    return { data: json.data, sha: json.sha };
  } catch (e) {
    console.log(`Netlify function failed, loading local ${file}:`, e);
    // Fallback to local JSON file
    try {
      const res = await fetch(`data/${file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { data, sha: '' };
    } catch (fallbackError) {
      console.error(`Failed to load ${file}:`, fallbackError);
      alert(`Error loading ${file}: ${fallbackError.message}`);
      return { data: [], sha: '' };
    }
  }
}

async function loadAdminData() {
  const g = await fetchJSON('gallery.json');
  galleryData = g.data;
  const s = await fetchJSON('shop.json');
  shopData = s.data;
  const w = await fetchJSON('workshops.json');
  workshopsData = w.data;
  renderAdminGallery();
  renderAdminShop();
  renderAdminWorkshops();
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

// ─── WORKSHOPS ────────────────────────────────────────────────────
async function uploadWorkshop() {
  const file = document.getElementById('workshop-file').files[0];
  const title = document.getElementById('workshop-title').value;
  const date = document.getElementById('workshop-date').value;
  const time = document.getElementById('workshop-time').value;
  const duration = document.getElementById('workshop-duration').value;
  const description = document.getElementById('workshop-description').value;
  const cost = parseFloat(document.getElementById('workshop-cost').value);
  const maxSlots = parseInt(document.getElementById('workshop-slots').value);
  const multiDay = document.getElementById('workshop-multiday').checked;
  const daysAvailable = multiDay ? parseInt(document.getElementById('workshop-days-available').value) : 1;
  const stripeLink = document.getElementById('workshop-stripe').value;

  if (!title || !date || !time || !cost || !maxSlots) {
    return alert('Please fill in all required fields (title, date, time, cost, max slots).');
  }

  let imageUrl = '';
  if (file) {
    imageUrl = await uploadToCloudinary(file, 'workshops');
  }

  workshopsData.push({
    id: 'w' + Date.now(),
    title,
    date,
    time,
    duration,
    description,
    image: imageUrl,
    cost,
    maxSlots,
    enrolledCount: 0,
    multiDay,
    daysAvailable,
    stripeLink
  });

  document.getElementById('workshop-form').reset();
  document.getElementById('workshop-days-group').classList.add('hidden');
  renderAdminWorkshops();
}

function renderAdminWorkshops() {
  const list = document.getElementById('workshops-admin-list');
  list.innerHTML = '';

  workshopsData.forEach((workshop, i) => {
    const div = document.createElement('div');
    div.className = 'admin-workshop-item';
    div.innerHTML = `
      <div class="workshop-admin-header">
        <strong>${workshop.title}</strong>
        <span class="workshop-date">${workshop.date} @ ${workshop.time}</span>
      </div>
      <div class="workshop-admin-details">
        <small>Cost: $${workshop.cost} | Slots: ${workshop.enrolledCount}/${workshop.maxSlots}</small>
        ${workshop.image ? `<br><small>Image: ✓</small>` : ''}
        ${workshop.multiDay ? `<br><small>Multi-day: ${workshop.daysAvailable} days</small>` : ''}
      </div>
      <div class="workshop-admin-actions">
        <button class="btn-small" onclick="editWorkshop(${i})">Edit</button>
        <button class="btn-small btn-danger" onclick="removeWorkshop(${i})">Delete</button>
        <button class="btn-small" onclick="viewWorkshopEnrollments(${i})">View Enrollments (${workshop.enrolledCount})</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function removeWorkshop(i) {
  if (!confirm('Delete this workshop?')) return;
  workshopsData.splice(i, 1);
  renderAdminWorkshops();
}

function editWorkshop(i) {
  const workshop = workshopsData[i];
  document.getElementById('workshop-title').value = workshop.title;
  document.getElementById('workshop-date').value = workshop.date;
  document.getElementById('workshop-time').value = workshop.time;
  document.getElementById('workshop-duration').value = workshop.duration;
  document.getElementById('workshop-description').value = workshop.description;
  document.getElementById('workshop-cost').value = workshop.cost;
  document.getElementById('workshop-slots').value = workshop.maxSlots;
  document.getElementById('workshop-multiday').checked = workshop.multiDay;
  if (workshop.multiDay) {
    document.getElementById('workshop-days-group').classList.remove('hidden');
    document.getElementById('workshop-days-available').value = workshop.daysAvailable;
  }
  document.getElementById('workshop-stripe').value = workshop.stripeLink;

  // Remove the old workshop and update after save
  workshopsData.splice(i, 1);
  renderAdminWorkshops();

  // Scroll to form
  document.getElementById('workshop-form').scrollIntoView({ behavior: 'smooth' });
}

function viewWorkshopEnrollments(i) {
  const workshop = workshopsData[i];
  const enrollments = JSON.parse(localStorage.getItem('workshopEnrollments') || '[]')
    .filter(e => e.workshopId === workshop.id);

  let html = `<h3>Enrollments for: ${workshop.title}</h3>`;
  html += `<p>Total: ${enrollments.length}</p>`;

  if (enrollments.length === 0) {
    html += '<p>No enrollments yet.</p>';
  } else {
    html += '<table border="1" cellpadding="8"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Days</th><th>Cost</th><th>Date</th></tr>';
    enrollments.forEach(e => {
      html += `<tr><td>${e.firstName} ${e.lastName}</td><td>${e.email}</td><td>${e.phone}</td><td>${e.days}</td><td>$${e.cost}</td><td>${new Date(e.timestamp).toLocaleDateString()}</td></tr>`;
    });
    html += '</table>';
  }

  const win = window.open();
  win.document.write(html);
  win.document.close();
}

function toggleWorkshopMultiDay() {
  const isChecked = document.getElementById('workshop-multiday').checked;
  const daysGroup = document.getElementById('workshop-days-group');
  if (isChecked) {
    daysGroup.classList.remove('hidden');
  } else {
    daysGroup.classList.add('hidden');
  }
}

// ─── SAVE TO GITHUB ───────────────────────────────────────────────
async function saveChanges() {
  document.getElementById('save-status').textContent = 'Saving...';
  try {
    await saveFile('gallery.json', galleryData);
    await saveFile('shop.json', shopData);
    await saveFile('workshops.json', workshopsData);
    document.getElementById('save-status').textContent = '✅ Saved! Site will update in ~1 minute.';
  } catch (e) {
    document.getElementById('save-status').textContent = '❌ Error: ' + e.message;
  }
}

async function saveFile(file, data) {
  const res = await fetch(`${API_BASE}/github-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file,
      data,
      password: adminPassword
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `HTTP ${res.status}`);
  }
}

// ─── GITHUB TOKEN MANAGEMENT ──────────────────────────────────────
// GitHub PAT is now stored as a repository secret in Netlify - no manual configuration needed!
// The serverless functions will automatically use it from environment variables.