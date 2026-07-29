// ─── CONFIG ───────────────────────────────────────────────────────
const GITHUB_OWNER = 'callumbrown01';
const GITHUB_REPO = 'julieannbrown-website';

// ─── DATA ──────────────────────────────────────────────────────────
let workshopsData = [];
let currentEnrolWorkshop = null;

// ─── INIT ──────────────────────────────────────────────────────────
async function initWorkshops() {
  try {
    const githubToken = localStorage.getItem('githubToken');
    
    // Try to fetch from GitHub API if token is available
    if (githubToken) {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/workshops.json`, {
        headers: { Authorization: `token ${githubToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        workshopsData = JSON.parse(atob(json.content));
      } else {
        throw new Error('GitHub fetch failed');
      }
    } else {
      // Fallback to local fetch without authentication
      const res = await fetch('data/workshops.json');
      workshopsData = await res.json();
    }
  } catch (e) {
    console.error('Failed to load workshops:', e);
    try {
      const res = await fetch('data/workshops.json');
      workshopsData = await res.json();
    } catch (err) {
      console.error('Fallback also failed:', err);
      workshopsData = [];
    }
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
    const spotsLeft = workshop.maxSlots - (workshop.enrolledCount || 0);
    const isFull = spotsLeft <= 0;

    const div = document.createElement('div');
    div.className = `workshop-card ${isFull ? 'full' : ''}`;
    
    const imageHtml = workshop.image ? `<img src="${workshop.image}" alt="${workshop.title}" class="workshop-image">` : '';
    
    div.innerHTML = `
      ${imageHtml}
      <div class="workshop-info">
        <h3>${workshop.title}</h3>
        <p class="workshop-date"><strong>Date:</strong> ${formatDate(workshop.date)}</p>
        <p class="workshop-time"><strong>Time:</strong> ${workshop.time} (${workshop.duration})</p>
        <p class="workshop-description">${workshop.description}</p>
        <p class="workshop-spots"><strong>Spots available:</strong> ${Math.max(0, spotsLeft)} / ${workshop.maxSlots}</p>
        ${workshop.multiDay ? `<p class="workshop-multiday"><strong>Duration:</strong> ${workshop.daysAvailable} days available</p>` : ''}
        <button 
          class="btn-enrol ${isFull ? 'disabled' : ''}" 
          onclick="openEnrolForm('${workshop.id}')"
          ${isFull ? 'disabled' : ''}
        >
          ${isFull ? 'Class Full' : 'Enrol Now'}
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

// ─── ENROL FORM ────────────────────────────────────────────────────
function openEnrolForm(workshopId) {
  currentEnrolWorkshop = workshopsData.find(w => w.id === workshopId);
  if (!currentEnrolWorkshop) return;

  // Reset form
  document.getElementById('enrol-form').reset();
  document.getElementById('enrol-modal-title').textContent = `Enrol in: ${currentEnrolWorkshop.title}`;

  // Show/hide days selection
  const daysGroup = document.getElementById('enrol-days-group');
  if (currentEnrolWorkshop.multiDay) {
    daysGroup.classList.remove('hidden');
    document.getElementById('enrol-days').required = true;
  } else {
    daysGroup.classList.add('hidden');
    document.getElementById('enrol-days').required = false;
    document.getElementById('enrol-days').value = '1';
  }

  // Display cost
  const costLabel = document.getElementById('enrol-cost-label');
  if (currentEnrolWorkshop.multiDay) {
    costLabel.textContent = `Cost: $${currentEnrolWorkshop.cost} per day (selected days)`;
  } else {
    costLabel.textContent = `Cost: $${currentEnrolWorkshop.cost}`;
  }

  // Show modal
  document.getElementById('enrol-modal').classList.remove('hidden');
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
  const days = document.getElementById('enrol-days').value || '1';

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
    days: parseInt(days),
    cost: currentEnrolWorkshop.cost * parseInt(days),
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  // Store enrollment in localStorage for now
  let enrollments = JSON.parse(localStorage.getItem('workshopEnrollments') || '[]');
  enrollments.push(enrollment);
  localStorage.setItem('workshopEnrollments', JSON.stringify(enrollments));

  // Redirect to Stripe payment link if available
  if (currentEnrolWorkshop.stripeLink) {
    const stripeUrl = new URL(currentEnrolWorkshop.stripeLink);
    stripeUrl.searchParams.append('prefilled_email', email);
    stripeUrl.searchParams.append('prefilled_name', `${firstName} ${lastName}`);
    window.location.href = stripeUrl.toString();
  } else {
    alert(`Thank you for enrolling, ${firstName}! We will contact you at ${email} to confirm your enrollment and payment details.`);
    closeEnrolForm();
    renderWorkshops();
  }
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
  const modal = document.getElementById('enrol-modal');
  if (e.target === modal) {
    closeEnrolForm();
  }
});
