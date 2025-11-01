// Simple client-side router for clean URLs
(function() {
  'use strict';

  // Route configuration - maps clean URLs to actual HTML files
  const routes = {
    '/': 'index.html',
    '/crop': 'crop.html',
    '/convert': 'convert.html',
    '/resize': 'resize.html',
    '/compress': 'compress.html',
    '/remove-background': 'remove-background.html'
  };

  // Get the base path (handles GitHub Pages subdirectories)
  function getBasePath() {
    const path = window.location.pathname;
    // If hosted on GitHub Pages with a repo name, extract it
    const match = path.match(/^\/[^\/]+/);
    if (match && !match[0].endsWith('.html')) {
      return match[0];
    }
    return '';
  }

  const basePath = getBasePath();

  // Navigate to a route
  function navigateTo(path) {
    const route = routes[path];
    if (!route) {
      console.error('Route not found:', path);
      return;
    }

    // For index.html, just update URL and reload if needed
    if (route === 'index.html') {
      window.history.pushState({}, '', basePath + path);
      if (window.location.pathname !== (basePath + '/') && window.location.pathname !== basePath + '/index.html') {
        window.location.href = basePath + '/';
      }
      return;
    }

    // Update URL without reload
    window.history.pushState({ path: path, file: route }, '', basePath + path);

    // Fetch and load the content
    loadPage(route);
  }

  // Load page content
  function loadPage(file) {
    fetch(file)
      .then(response => {
        if (!response.ok) throw new Error('Page not found');
        return response.text();
      })
      .then(html => {
        // Replace entire document
        document.open();
        document.write(html);
        document.close();
      })
      .catch(error => {
        console.error('Error loading page:', error);
        document.body.innerHTML = `<div style="text-align:center;padding:50px;"><h1>404</h1><p>Page not found</p><a href="/">Go Home</a></div>`;
      });
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    if (event.state && event.state.file) {
      loadPage(event.state.file);
    } else {
      // Going back to home or initial state
      window.location.reload();
    }
  });

  // Intercept clicks on links
  document.addEventListener('click', function(e) {
    // Check if clicked element is a link or inside a link
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Check if it's one of our routable pages
    if (href.endsWith('.html')) {
      const fileName = href.split('/').pop();
      const routePath = Object.keys(routes).find(key => routes[key] === fileName);
      
      if (routePath) {
        e.preventDefault();
        navigateTo(routePath);
      }
    }
  });

  // Handle initial page load - if URL has .html, redirect to clean URL
  window.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname.replace(basePath, '');
    
    // If we're on a .html page, redirect to clean URL
    if (currentPath.endsWith('.html') && currentPath !== '/index.html') {
      const fileName = currentPath.split('/').pop();
      const routePath = Object.keys(routes).find(key => routes[key] === fileName);
      
      if (routePath) {
        window.history.replaceState({ path: routePath, file: fileName }, '', basePath + routePath);
      }
    }
  });

  // Export for use in other scripts
  window.router = {
    navigateTo: navigateTo,
    routes: routes
  };
})();

