// Simple Router for ImageNerd - Clean URLs without .html extensions
// All routes now serve separate HTML files
(function() {
  'use strict';

  // Simple navigation function - all routes are external pages now
  function navigate(route) {
    // Navigate to the clean URL
    window.location.href = route === 'home' ? '/' : '/' + route;
  }

  // Handle navigation clicks - allow normal browser navigation for all routes
  function handleNavigationClick(e) {
    const link = e.target.closest('a[data-route]');
    if (link) {
      const route = link.getAttribute('data-route');
      if (route) {
        // For all routes, allow normal browser navigation to clean URLs
        // The href attributes are already set to /route format
        return true;
      }
    }
  }

  // Update active navigation state
  function updateActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('a[data-route]').forEach(link => {
      link.classList.remove('active');
      const route = link.getAttribute('data-route');
      const expectedPath = route === 'home' ? '/' : '/' + route;
      if (currentPath === expectedPath) {
        link.classList.add('active');
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      document.addEventListener('click', handleNavigationClick);
      updateActiveNav();
    });
  } else {
    document.addEventListener('click', handleNavigationClick);
    updateActiveNav();
  }

  // Expose router globally for backward compatibility
  window.router = {
    navigate: navigate
  };

})();