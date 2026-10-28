function highlightCurrentPage() {
  const navLinks = document.querySelectorAll('.nav-menu a');
  
  if (navLinks.length === 0) {
    console.log('No nav links found yet, retrying...');
    setTimeout(highlightCurrentPage, 100);
    return;
  }
  
  const currentPath = window.location.pathname;
  
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    
    // Extract just the filename from current path
    const currentFileName = currentPath.split('/').pop() || '';
    
    // Check for match
    let isMatch = false;
    
    if (href === 'index.html') {
      // Match index.html for root paths or when no file extension
      isMatch = currentFileName === '' || currentFileName === 'index.html' || !currentFileName.includes('.');
    } else {
      // Direct filename comparison
      isMatch = currentFileName === href;
    }
    
    if (isMatch) {
      link.classList.add('current-page');
    } else {
      link.classList.remove('current-page');
    }
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', highlightCurrentPage);
} else {
  highlightCurrentPage();
}

// Also run on page show (for browser back/forward)
window.addEventListener('pageshow', highlightCurrentPage);
