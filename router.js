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
    contactus: { inline: false, redirect: 'contact.html' },
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
      } else if (view === 'contactus' && !window.contactusInitialized) {
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
      if (view === 'contactus') {
        window.contactusInitialized = true;
      } else {
        window[view + 'Initialized'] = true;
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
      console.log('Router: initializing');

      // Handle popstate events for clean URLs
      window.addEventListener('popstate', function(event) {
        const path = window.location.pathname.substring(1) || 'home';
        console.log('Router: popstate to', path);
        if (routeConfig[path]) {
          self.navigate(path);
        } else if (path === '' || path === 'index.html') {
          self.navigate('home');
        }
      });

      // Handle initial route on page load
      let initialPath = window.location.pathname.substring(1);
      console.log('Router: initial path', initialPath);

      // Check if we have a stored path from 404.html redirect (for GitHub Pages SPA routing)
      const storedPath = sessionStorage.getItem('spa-path');
      if (storedPath) {
        sessionStorage.removeItem('spa-path');
        // Extract path from stored URL
        const url = new URL(storedPath, window.location.origin);
        initialPath = url.pathname.substring(1);
        console.log('Router: using stored path', initialPath);
      }

      if (initialPath && routeConfig[initialPath]) {
        self.navigate(initialPath);
      } else if (initialPath === '' || initialPath === 'index.html') {
        // Update URL to clean format for home page
        history.replaceState(null, '', '/');
        self.navigate('home');
      } else {
        // If path doesn't exist, redirect to home
        history.replaceState(null, '', '/');
        self.navigate('home');
      }
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

