// Simple SPA Router for ImageNerd
console.log('========== ROUTER.JS FILE IS LOADING ==========');
(function() {
  'use strict';
  console.log('========== ROUTER.JS IIFE EXECUTING ==========');

  // Configuration: which routes are inline vs separate pages
  const routeConfig = {
    home: { inline: true },
    compress: { inline: true },
    resize: { inline: true },
    crop: { inline: false, redirect: 'crop.html' },
    convert: { inline: false, redirect: 'convert.html' },
    about: { inline: false, redirect: 'about.html' },
    contact: { inline: false, redirect: 'contact.html' },
    privacy: { inline: false, redirect: 'privacy.html' },
    terms: { inline: false, redirect: 'terms.html' }
  };

  const router = {
    currentView: 'home',

    navigate: function(view) {
      console.log('Router: navigating to', view); // Debug log
      
      // Don't navigate if already on this view
      if (this.currentView === view) {
        console.log('Router: already on', view);
        return;
      }
      
      // Hide all views
      this.hideAllViews();
      this.currentView = view;
      
      // Show the selected view (using 'view-' prefix to match HTML IDs)
      const viewElement = document.getElementById('view-' + view);
      if (viewElement) {
        console.log('Router: showing view', 'view-' + view);
        viewElement.classList.add('active');
      } else {
        console.error('Router: view not found', 'view-' + view);
      }

      // Initialize view if needed
      if (view === 'compress' && !window.compressInitialized) {
        console.log('Router: initializing compress view');
        if (typeof initCompressView === 'function') {
          initCompressView();
        }
      } else if (view === 'resize' && !window.resizeInitialized) {
        console.log('Router: initializing resize view');
        if (typeof initResizeView === 'function') {
          initResizeView();
        }
      } else if (view === 'crop' && !window.cropInitialized) {
        console.log('Router: loading crop page');
        this.loadExternalPage(view, 'crop.html');
      } else if (view === 'convert' && !window.convertInitialized) {
        console.log('Router: loading convert page');
        this.loadExternalPage(view, 'convert.html');
      } else if (view === 'about' && !window.aboutInitialized) {
        console.log('Router: loading about page');
        this.loadExternalPage(view, 'about.html');
      } else if (view === 'contact' && !window.contactInitialized) {
        console.log('Router: loading contact page');
        this.loadExternalPage(view, 'contact.html');
      } else if (view === 'privacy' && !window.privacyInitialized) {
        console.log('Router: loading privacy page');
        this.loadExternalPage(view, 'privacy.html');
      } else if (view === 'terms' && !window.termsInitialized) {
        console.log('Router: loading terms page');
        this.loadExternalPage(view, 'terms.html');
      }
    },

    loadExternalPage: function(view, filename) {
      const viewElement = document.getElementById('view-' + view);
      if (!viewElement) return;
      
      // Show loading message
      viewElement.innerHTML = '<div style="text-align:center;padding:60px;"><div class="spinner-border" role="status"></div><p style="margin-top:20px;">Loading...</p></div>';
      
      // Load the page in an iframe to keep clean URL
      viewElement.innerHTML = `
        <iframe 
          src="${filename}" 
          style="width:100%;min-height:900px;border:none;display:block;" 
          title="${view} tool">
        </iframe>
      `;
      
      // Mark as initialized
      window[view + 'Initialized'] = true;
    },

    hideAllViews: function() {
      // Hide all views by removing 'active' class
      document.querySelectorAll('.view').forEach(function(view) {
        view.classList.remove('active');
      });
    },

    init: function() {
      const self = this;
      console.log('Router: initializing');

      // Determine routing strategy
      const isFileProtocol = window.location.protocol === 'file:';
      const isProduction = !isFileProtocol && window.location.hostname !== 'localhost';
      console.log('Router: protocol -', isFileProtocol ? 'file://' : 'http://');
      console.log('Router: environment -', isProduction ? 'production (clean URLs)' : isFileProtocol ? 'file protocol (hash URLs)' : 'localhost (index.html URLs)');

      if (isProduction) {
        // Production: Use clean URLs with History API
        window.addEventListener('popstate', function(event) {
          const fullPath = window.location.pathname;
          let pathRoute = 'home';

          if (fullPath.includes('/index.html/')) {
            // Extract route from /index.html/crop -> crop
            pathRoute = fullPath.split('/index.html/')[1] || 'home';
          } else if (fullPath.length > 1 && fullPath !== '/index.html') {
            // Extract route from /crop -> crop
            pathRoute = fullPath.substring(1);
          }

          console.log('Router: popstate to', pathRoute);
          if (routeConfig[pathRoute]) {
            self.navigate(pathRoute);
          } else {
            self.navigate('home');
          }
        });
      } else {
        // Development: Use hash URLs
        window.addEventListener('hashchange', function(event) {
          const hash = window.location.hash.substring(1) || 'home';
          console.log('Router: hashchange to', hash);
          if (routeConfig[hash]) {
            self.navigate(hash);
          } else {
            self.navigate('home');
          }
        });
      }

      // Handle initial route on page load
      let initialRoute = 'home';

      // Check pathname for initial route (works for both production and development)
      const fullPath = window.location.pathname;
      console.log('Router: full pathname', fullPath);

      // Handle URLs like /index.html/crop or /crop
      let pathRoute = '';
      if (fullPath.includes('/index.html/')) {
        // Extract route from /index.html/crop -> crop
        pathRoute = fullPath.split('/index.html/')[1];
        console.log('Router: extracted route from index.html URL:', pathRoute);
      } else if (fullPath.length > 1) {
        // Extract route from /crop -> crop
        pathRoute = fullPath.substring(1);
        console.log('Router: extracted route from clean URL:', pathRoute);
      }

      // Check if we have a stored path from 404.html redirect (for GitHub Pages SPA routing)
      const storedPath = sessionStorage.getItem('spa-path');
      if (storedPath) {
        sessionStorage.removeItem('spa-path');
        const url = new URL(storedPath, window.location.origin);
        const storedRoute = url.pathname.includes('/index.html/')
          ? url.pathname.split('/index.html/')[1]
          : url.pathname.substring(1);
        if (storedRoute && routeConfig[storedRoute]) {
          initialRoute = storedRoute;
          console.log('Router: using stored path route', initialRoute);
        }
      } else if (pathRoute && routeConfig[pathRoute] && !isFileProtocol) {
        initialRoute = pathRoute;
        console.log('Router: using pathname route', initialRoute);
      } else {
        // File protocol or development: Check hash for initial route
        const hash = window.location.hash.substring(1);
        console.log('Router: initial hash', hash);
        if (hash && routeConfig[hash]) {
          initialRoute = hash;
        }
      }

      console.log('Router: navigating to initial route', initialRoute);
      self.navigate(initialRoute);
    }
  };

  // Expose router globally
  window.router = router;

  // Initialize router
  console.log('Router: script loaded, readyState:', document.readyState);
  router.init();
  
  // Add global click listener for debugging
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link) {
      console.log('Router: link clicked', link.href);
    }
  });
})();

