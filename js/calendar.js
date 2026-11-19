// ─── CALENDAR STATE ───────────────────────────────────────────────────
let currentCalendarMonth = null;
let currentCalendarYear = null;
let workshopDates = new Map(); // Map of "YYYY-MM-DD" to workshop IDs

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadWorkshopDates();
  initCalendar();
  setupCalendarNavigation();
});

// ─── LOAD WORKSHOP DATES ──────────────────────────────────────────
async function loadWorkshopDates() {
  try {
    const res = await fetch('data/workshops.json');
    if (!res.ok) throw new Error('Failed to fetch');
    const workshopsData = await res.json();
    
    workshopsData.forEach(workshop => {
      if (workshop.modalContent && workshop.modalContent.dates) {
        const dates = parseDates(workshop.modalContent.dates);
        dates.forEach(date => {
          const dateKey = formatDateKey(date);
          if (!workshopDates.has(dateKey)) {
            workshopDates.set(dateKey, []);
          }
          workshopDates.get(dateKey).push(workshop.id);
        });
      }
    });
  } catch (e) {
    console.error('Failed to load workshop dates:', e);
  }
}

// ─── PARSE DATES FROM TEXT ────────────────────────────────────────
function parseDates(dateString) {
  const dates = [];
  
  // Pattern 1: "Saturdays January 16, 30 | February 13, 27 | March 13, 27"
  if (dateString.includes('January') || dateString.includes('February') || dateString.includes('March') || dateString.includes('April')) {
    const monthPattern = /(January|February|March|April)\s+([\d, &]+)/g;
    let match;
    
    while ((match = monthPattern.exec(dateString)) !== null) {
      const month = match[1];
      const dayString = match[2];
      
      // Extract day numbers (handle both "16, 30" and "16 & 17" formats)
      const dayMatches = dayString.match(/\d+/g);
      
      if (dayMatches) {
        dayMatches.forEach(day => {
          const date = parseDate(month, parseInt(day));
          if (date) dates.push(date);
        });
      }
    }
  }
  
  return dates;
}

// ─── PARSE INDIVIDUAL DATE ────────────────────────────────────────
function parseDate(monthName, day) {
  const monthMap = {
    'January': 0,
    'February': 1,
    'March': 2,
    'April': 3,
    'May': 4,
    'June': 5,
    'July': 6,
    'August': 7,
    'September': 8,
    'October': 9,
    'November': 10,
    'December': 11
  };
  
  const month = monthMap[monthName];
  if (month === undefined) return null;
  
  // Determine year based on month
  // If month is January-March, use 2027; if past that, use current year or future
  let year = new Date().getFullYear();
  if (month >= 0 && month <= 3) {
    // Check if this month has already passed this year
    const today = new Date();
    if (month < today.getMonth() || (month === today.getMonth() && day < today.getDate())) {
      year = new Date().getFullYear() + 1;
    }
  }
  
  return new Date(year, month, day);
}

// ─── FORMAT DATE KEY ──────────────────────────────────────────────
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── INIT CALENDAR ────────────────────────────────────────────────
function initCalendar() {
  // Start with the month of the earliest workshop date
  const earliestDate = findEarliestWorkshopDate();
  
  if (earliestDate) {
    currentCalendarMonth = earliestDate.getMonth();
    currentCalendarYear = earliestDate.getFullYear();
  } else {
    // Default to current month
    const today = new Date();
    currentCalendarMonth = today.getMonth();
    currentCalendarYear = today.getFullYear();
  }
  
  renderCalendar();
}

// ─── FIND EARLIEST WORKSHOP DATE ──────────────────────────────────
function findEarliestWorkshopDate() {
  let earliest = null;
  
  workshopDates.forEach((_ids, dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (!earliest || date < earliest) {
      earliest = date;
    }
  });
  
  return earliest;
}

// ─── SETUP CALENDAR NAVIGATION ────────────────────────────────────
function setupCalendarNavigation() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
      currentCalendarMonth = 11;
      currentCalendarYear--;
    }
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
      currentCalendarMonth = 0;
      currentCalendarYear++;
    }
    renderCalendar();
  });
}

// ─── RENDER CALENDAR ──────────────────────────────────────────────
function renderCalendar() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Update header
  document.getElementById('calendarMonthYear').textContent = 
    `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
  
  // Clear calendar days
  const calendarDays = document.getElementById('calendarDays');
  calendarDays.innerHTML = '';
  
  // Get first day of month and number of days
  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    calendarDays.appendChild(emptyCell);
  }
  
  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatDateKey(new Date(currentCalendarYear, currentCalendarMonth, day));
    const hasWorkshop = workshopDates.has(dateKey);
    
    const dayCell = document.createElement('div');
    dayCell.className = `calendar-day ${hasWorkshop ? 'has-workshop' : ''}`;
    dayCell.textContent = day;
    
    if (hasWorkshop) {
      const workshopIds = workshopDates.get(dateKey);
      dayCell.style.cursor = 'pointer';
      dayCell.addEventListener('click', () => {
        // Open the first workshop on this date
        if (typeof openWorkshopInfo === 'function') {
          openWorkshopInfo(workshopIds[0]);
        }
      });
      dayCell.setAttribute('title', `${workshopIds.length} workshop(s) available`);
    }
    
    calendarDays.appendChild(dayCell);
  }
}

