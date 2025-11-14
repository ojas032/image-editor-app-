// Simple Router Implementation for ImageNerd (Frontend)
// Handles navigation between separate HTML pages
(function() {
  'use strict';

  // Route configurations - mapping routes to HTML files
  const routeConfig = {
    'home': 'index.html',
    'compress': 'compress.html',
    'resize': 'resize.html',
    'about': 'about.html',
    'contact': 'contact.html',
    'privacy': 'privacy.html',
    'terms': 'terms.html'
  };

  // Simple navigation function
  function navigate(route) {
    const page = routeConfig[route];
    if (page) {
      window.location.href = page;
    } else {
      console.error('Route not found:', route);
    }
  }

  // Handle navigation clicks
  function handleNavigationClick(e) {
    const link = e.target.closest('a[data-route]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      const route = link.getAttribute('data-route');
      if (route) {
        navigate(route);
      }
      return false;
    }
  }

  // Initialize
  document.addEventListener('click', handleNavigationClick);

  // Expose navigate function globally
  window.router = {
    navigate: navigate
  };

})();