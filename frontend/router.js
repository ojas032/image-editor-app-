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
    about: { type: 'inline' },
    contact: { type: 'inline' }
    // External routes (crop, convert, privacy, terms) handled server-side
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

    // Only handle inline routes - external routes handled server-side
    viewElement.classList.add('active');

    // Initialize if needed
    if (config.init && !window[viewName + 'Initialized']) {
      const initFunction = window[config.init];
      if (typeof initFunction === 'function') {
        initFunction();
      }
      window[viewName + 'Initialized'] = true;
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
    // Check for GitHub Pages route first (with retry for timing issues)
    function checkGitHubPagesRoute() {
      if (window.githubPagesRoute) {
        const route = window.githubPagesRoute;
        console.log('Router: Handling GitHub Pages route:', route);
        delete window.githubPagesRoute; // Clean up

        // Handle special case: 'home' route should go to root
        if (route === 'home' || route === '') {
          router.navigate('/');
          return true;
        }

        if (viewConfig[route]) {
          console.log('Router: Navigating to:', '/' + route);
          router.navigate('/' + route);
          return true;
        } else {
          console.log('Router: Route not found in viewConfig:', route, '- available routes:', Object.keys(viewConfig));
        }
      }
      return false;
    }

    // Try immediately
    if (checkGitHubPagesRoute()) return;

    // If not found, try again after a short delay (in case script loads after router)
    setTimeout(() => {
      if (checkGitHubPagesRoute()) return;
    }, 10);

    // Also check current pathname as fallback for GitHub Pages
    const currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath !== '/index.html' && currentPath !== '/404.html') {
      const route = currentPath.substring(1);
      console.log('Router: Checking current path for route:', route);

      if (route === 'home' || route === '') {
        router.navigate('/');
        return;
      }

      if (viewConfig[route] && viewConfig[route].type === 'inline') {
        console.log('Router: Found inline route from pathname:', route);
        router.navigate('/' + route);
        return;
      }
    }

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