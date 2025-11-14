// Navigo Router Implementation for ImageNerd (Frontend)
(function() {
  'use strict';

  // Initialize Navigo router - use History API for clean URLs everywhere
  const router = new Navigo('/', { hash: false });

  // View configurations
  const viewConfig = {
    home: { type: 'inline' },
    compress: { type: 'inline', init: 'initCompressView' },
    resize: { type: 'inline', init: 'initResizeView' },
    crop: { type: 'external', file: 'crop.html' },
    convert: { type: 'external', file: 'convert.html' },
    about: { type: 'inline' },
    contact: { type: 'inline' },
    privacy: { type: 'external', file: 'privacy.html' },
    terms: { type: 'external', file: 'terms.html' }
  };

  let currentView = 'home';

  // Handle route changes (used for popstate and direct navigation)
  function handleRouteChange(pathname) {
    const route = pathname === '/' ? 'home' : pathname.substring(1);
    if (viewConfig[route]) {
      hideAllViews();
      showView(route);
      currentView = route;
    }
  }

  // Hide all views
  function hideAllViews() {
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
  }

  // Show a specific view
  function showView(viewName) {
    const config = viewConfig[viewName];
    const viewElement = document.getElementById('view-' + viewName);

    if (!viewElement) {
      console.error('View not found:', viewName);
      return;
    }

    if (config.type === 'inline') {
      viewElement.classList.add('active');

      // Initialize if needed
      if (config.init && !window[viewName + 'Initialized']) {
        const initFunction = window[config.init];
        if (typeof initFunction === 'function') {
          initFunction();
        }
        window[viewName + 'Initialized'] = true;
      }
    } else if (config.type === 'external') {
      if (!window[viewName + 'Initialized']) {
        viewElement.innerHTML = `
          <iframe
            src="${config.file}"
            style="width:100%;min-height:900px;border:none;display:block;"
            title="${viewName} tool">
          </iframe>
        `;
        window[viewName + 'Initialized'] = true;
      }
      viewElement.classList.add('active');
    }

    // Scroll to top when showing a new view
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  // Define routes
  router.on('/', function() {
    hideAllViews();
    showView('home');
    currentView = 'home';
  });

  router.on('/compress', function() {
    hideAllViews();
    showView('compress');
    currentView = 'compress';
  });

  router.on('/resize', function() {
    hideAllViews();
    showView('resize');
    currentView = 'resize';
  });

  router.on('/crop', function() {
    hideAllViews();
    showView('crop');
    currentView = 'crop';
  });

  router.on('/convert', function() {
    hideAllViews();
    showView('convert');
    currentView = 'convert';
  });

  router.on('/about', function() {
    hideAllViews();
    showView('about');
    currentView = 'about';
  });

  router.on('/contact', function() {
    hideAllViews();
    showView('contact');
    currentView = 'contact';
  });

  router.on('/privacy', function() {
    hideAllViews();
    showView('privacy');
    currentView = 'privacy';
  });

  router.on('/terms', function() {
    hideAllViews();
    showView('terms');
    currentView = 'terms';
  });

  // Handle initial load with clean URL support
  function handleInitialLoad() {
    const storedPath = sessionStorage.getItem('spa-path');
    if (storedPath) {
      sessionStorage.removeItem('spa-path');
      const url = new URL(storedPath, window.location.origin);
      const cleanRoute = url.pathname.substring(1);
      if (cleanRoute && viewConfig[cleanRoute]) {
        router.navigate('/' + cleanRoute);
        return;
      }
    }

    router.resolve();
  }

  // Handle navigation clicks
  function handleNavigationClick(e) {
    const link = e.target.closest('a[data-route]');
    if (link) {
      console.log('Navigation click detected:', link, 'route:', link.getAttribute('data-route'));
      e.preventDefault();
      e.stopPropagation();
      const route = link.getAttribute('data-route');
      if (route) {
        const path = route === 'home' ? '/' : '/' + route;
        console.log('Navigating to:', path, 'using router.navigate');
        try {
          router.navigate(path);
          console.log('Router.navigate completed, current URL:', window.location.href);
        } catch (error) {
          console.error('Router.navigate failed:', error);
          // Fallback: try to navigate directly
          try {
            window.history.pushState(null, '', path);
            handleRouteChange(path);
          } catch (fallbackError) {
            console.error('Fallback navigation also failed:', fallbackError);
          }
        }
      }
      return false;
    }
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    handleRouteChange(window.location.pathname);
  });

  // Initialize
  document.addEventListener('click', handleNavigationClick);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleInitialLoad);
  } else {
    handleInitialLoad();
  }

  // Expose router globally
  window.router = router;

})();