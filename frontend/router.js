// Simple SPA Router for ImageNerd
(function() {
  'use strict';

  // Configuration: which routes are inline vs separate pages
  const routeConfig = {
    home: { inline: true },
    compress: { inline: true },
    resize: { inline: true },
    crop: { inline: false, redirect: 'crop.html' },
    convert: { inline: false, redirect: 'convert.html' }
  };

  const router = {
    currentView: 'home',

    navigate: function(view) {
      // Check if this route should redirect to a separate page
      if (routeConfig[view] && !routeConfig[view].inline) {
        window.location.href = routeConfig[view].redirect;
        return;
      }

      // Handle inline routes
      if (this.currentView === view) return;
      
      this.hideAllViews();
      this.currentView = view;
      
      // Show the selected view (using 'view-' prefix to match HTML IDs)
      const viewElement = document.getElementById('view-' + view);
      if (viewElement) {
        viewElement.classList.add('active');
      }

      // Initialize view if needed
      if (view === 'compress' && !window.compressInitialized) {
        if (typeof initCompressView === 'function') {
          initCompressView();
        }
      } else if (view === 'resize' && !window.resizeInitialized) {
        if (typeof initResizeView === 'function') {
          initResizeView();
        }
      }

      // Update URL hash
      if (view !== 'home') {
        window.location.hash = view;
      } else {
        history.pushState('', document.title, window.location.pathname);
      }
    },

    hideAllViews: function() {
      // Hide all views by removing 'active' class
      document.querySelectorAll('.view').forEach(function(view) {
        view.classList.remove('active');
      });
    },

    init: function() {
      const self = this;

      // Handle hash changes
      window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        if (hash && routeConfig[hash]) {
          self.navigate(hash);
        }
      });

      // Handle initial route on page load
      const initialHash = window.location.hash.substring(1);
      if (initialHash && routeConfig[initialHash]) {
        self.navigate(initialHash);
      } else {
        self.navigate('home');
      }

      // Intercept navigation link clicks
      document.addEventListener('click', function(e) {
        const target = e.target.closest('a[data-route]');
        if (target) {
          e.preventDefault();
          const route = target.getAttribute('data-route');
          self.navigate(route);
        }
      });
    }
  };

  // Expose router globally
  window.router = router;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      router.init();
    });
  } else {
    router.init();
  }
})();

