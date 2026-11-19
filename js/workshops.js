// ─── CONFIG ───────────────────────────────────────────────────────
const GITHUB_OWNER = 'callumbrown01';
const GITHUB_REPO = 'julieannbrown-website';

// ─── DATA ──────────────────────────────────────────────────────────
let workshopsData = [];
let currentEnrolWorkshop = null;

// ─── INIT ──────────────────────────────────────────────────────────
async function initWorkshops() {
  try {
    // Fetch from local file (GitHub updates via Netlify Functions)
    const res = await fetch('data/workshops.json');
    if (!res.ok) throw new Error('Failed to fetch');
    workshopsData = await res.json();
  } catch (e) {
    console.error('Failed to load workshops:', e);
    workshopsData = [];
  }
  renderWorkshops();
}

// ─── RENDER ───────────────────────────────────────────────────────
function renderWorkshops() {
  const container = document.getElementById('workshops-list');
  container.innerHTML = '';

  if (workshopsData.length === 0) {
    container.innerHTML = '<p class="no-workshops">No workshops available at the moment. Check back soon!</p>';
    return;
  }

  workshopsData.forEach(workshop => {
    const div = document.createElement('div');
    div.className = 'workshop-card';
    div.onclick = () => openWorkshopInfo(workshop.id);

    const imageHtml = workshop.image ? `<img src="${workshop.image}" alt="${workshop.title}" class="workshop-image">` : '';

    div.innerHTML = `
      ${imageHtml}
      <div class="workshop-overlay">
        <h3>${workshop.title}</h3>
      </div>
    `;
    container.appendChild(div);
  });
}

// ─── WORKSHOP INFO MODAL ───────────────────────────────────────────
function openWorkshopInfo(workshopId) {
  const workshop = workshopsData.find(w => w.id === workshopId);
  if (!workshop || !workshop.modalContent) return;

  const modal = document.getElementById('workshop-info-modal');
  const body = document.getElementById('workshop-info-body');
  const content = workshop.modalContent;

  let html = `<h2>${content.title}</h2>`;

  if (content.dates) {
    html += `<div class="workshop-detail"><strong>Dates:</strong> ${content.dates}</div>`;
  }

  if (content.time) {
    html += `<div class="workshop-detail"><strong>Time:</strong> ${content.time}</div>`;
  }

  if (content.investment) {
    html += `<div class="workshop-detail"><strong>Investment:</strong> ${content.investment}</div>`;
  }

  if (content.location) {
    html += `<div class="workshop-detail"><strong>Location:</strong> ${content.location}</div>`;
  }

  if (content.description) {
    html += `<div class="workshop-description-full">${content.description.split('\n').join('<br>')}</div>`;
  }

  // Add action buttons if not a placeholder
  if (!workshop.isPlaceholder) {
    html += `
      <div class="workshop-modal-actions">
        <button class="btn-workshop-book" onclick="openEnrolForm('${workshop.id}')">Book</button>
        <button class="btn-workshop-email" onclick="openEmailModal()">Unsure? Email me</button>
      </div>
    `;
  } else {
    html += `
      <div class="workshop-modal-actions">
        <button class="btn-workshop-email" onclick="openEmailModal()">Interested? Email me</button>
      </div>
    `;
  }

  html += `<div class="workshop-modal-terms"><a href="#" onclick="openTermsModal(event)">Terms and Conditions</a></div>`;

  body.innerHTML = html;
  modal.classList.remove('hidden');
}

function closeWorkshopInfo() {
  document.getElementById('workshop-info-modal').classList.add('hidden');
}

// ─── ENROL FORM ────────────────────────────────────────────────────
function openEnrolForm(workshopId) {
  const workshop = workshopsData.find(w => w.id === workshopId);
  if (!workshop) return;

  currentEnrolWorkshop = workshop;

  // Reset form
  document.getElementById('enrol-form').reset();
  document.getElementById('enrol-modal-title').textContent = `Enrol in: ${workshop.title}`;

  // Show modal
  document.getElementById('enrol-modal').classList.remove('hidden');
  closeWorkshopInfo();
}

function closeEnrolForm() {
  document.getElementById('enrol-modal').classList.add('hidden');
  currentEnrolWorkshop = null;
}

async function submitEnrolForm(e) {
  e.preventDefault();

  if (!currentEnrolWorkshop) return;

  const firstName = document.getElementById('enrol-first-name').value.trim();
  const lastName = document.getElementById('enrol-last-name').value.trim();
  const email = document.getElementById('enrol-email').value.trim();
  const phone = document.getElementById('enrol-phone').value.trim();

  if (!firstName || !lastName || !email || !phone) {
    alert('Please fill in all required fields.');
    return;
  }

  // Create enrollment object
  const enrollment = {
    id: 'e' + Date.now(),
    workshopId: currentEnrolWorkshop.id,
    firstName,
    lastName,
    email,
    phone,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  // Store enrollment in localStorage for now
  let enrollments = JSON.parse(localStorage.getItem('workshopEnrollments') || '[]');
  enrollments.push(enrollment);
  localStorage.setItem('workshopEnrollments', JSON.stringify(enrollments));

  alert(`Thank you for enrolling, ${firstName}! We will contact you at ${email} to confirm your enrollment and payment details.`);
  closeEnrolForm();
  renderWorkshops();
}

// ─── EMAIL MODAL ───────────────────────────────────────────────────
function openEmailModal() {
  // Placeholder for email functionality
  window.location.href = 'mailto:julie@julieannbrown.com';
}

// ─── TERMS MODAL ───────────────────────────────────────────────────
function openTermsModal(e) {
  e.preventDefault();
  
  const termsContent = `
    <h2>Terms and Conditions</h2>
    
    <h3>Privacy</h3>
    <p>The information collected for the booking of these workshops is intended only for administration purposes.</p>
    <p>By booking with us we assume you may be interested in similar events and therefore we may contact you regarding future opportunities.</p>
    <p>Photography may be taken during these events that may be used in future promotion.</p>
    <p>Please advise if you wish to opt-out of your image being reproduced.</p>
    <p>Participants must seek permission to take photographs during the workshops. Video recording is prohibited for the duration of the workshops.</p>
    
    <h3>Securing Your Place</h3>
    <p>Your place is secured in the selected class or workshop upon full payment. You will receive confirmation and further details via email within the 24 hours after booking.</p>
    
    <h3>Cancellation Policy</h3>
    <ul>
      <li>More than seven days prior will receive a full refund less a $50 administration fee</li>
      <li>Within seven days if your position is filled you will receive a full refund less a $50 administration fee</li>
      <li>No refunds if cancelled within 48 hours of the event</li>
      <li>All funds will be fully refunded in the unlikely event Julie-Ann has to cancel</li>
    </ul>
    
    <h3>Workshop Location</h3>
    <p>Less than 10 minutes drive north-west of Margaret River township between Bussell Highway and Caves Road in the beautiful, forested Burnside community.</p>
    
    <h3>Workshop Environment</h3>
    <p>It is the Participants responsibility to wear workshop appropriate clothing where there is exposure to paints and liquids.</p>
    <ul>
      <li>Closed in shoes are essential</li>
      <li>An apron or old long-sleeved overshirt as a minimum protection for clothing</li>
      <li>Gloves are optional</li>
      <li>Water bottle</li>
      <li>Notepad and pencil</li>
      <li>Tea, coffee, rainwater and access to the biscuit tin provided</li>
      <li>Lunch must be brought with you. Food can be stored in the studio fridge and there is a microwave available for use</li>
    </ul>
  `;

  // Create and show a modal with terms
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'terms-modal';
  modal.innerHTML = `
    <div class="modal-content terms-modal-content">
      <button class="modal-close" onclick="document.getElementById('terms-modal').remove()">&times;</button>
      <div class="terms-body">${termsContent}</div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ─── UTILITIES ─────────────────────────────────────────────────────
function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-AU', options);
}

// ─── INIT ON PAGE LOAD ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initWorkshops);

// Close modal on outside click
document.addEventListener('click', (e) => {
  const infoModal = document.getElementById('workshop-info-modal');
  const enrolModal = document.getElementById('enrol-modal');
  
  if (e.target === infoModal) {
    closeWorkshopInfo();
  }
  if (e.target === enrolModal) {
    closeEnrolForm();
  }
});
