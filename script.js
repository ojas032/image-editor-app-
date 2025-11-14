(() => {
  // Apply theme immediately (before DOM loads) to prevent flash
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('imngrd_theme') || 'light';
  if (storedTheme === 'dark') {
    root.classList.add('theme-dark');
    // Also add to body when available (for pages with inline styles)
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('theme-dark');
    }, { once: true });
  }
  
  // Listen for theme changes from parent window (for iframe pages)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'themeChange') {
      const isDark = event.data.theme === 'dark';
      if (isDark) {
        root.classList.add('theme-dark');
        document.body.classList.add('theme-dark');
      } else {
        root.classList.remove('theme-dark');
        document.body.classList.remove('theme-dark');
      }
      console.log('Theme updated from parent:', event.data.theme);
    }
  });

  // Ensure DOM is ready
  function initializeApp() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Simple mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    const cta = document.querySelector('.header-cta');
    
    function closeMenu() {
      if (toggle && nav && cta) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.removeAttribute('data-open');
        cta.removeAttribute('data-open');
        if (window.innerWidth < 900) {
          nav.style.display = '';
          cta.style.display = '';
        }
        // Re-enable body scroll
        document.body.style.overflow = '';
      }
    }
    
    function openMenu() {
      if (toggle && nav && cta) {
        toggle.setAttribute('aria-expanded', 'true');
        nav.setAttribute('data-open', '');
        cta.setAttribute('data-open', '');
        nav.style.display = 'flex';
        cta.style.display = 'flex';
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
        
        // Add close button if it doesn't exist
        if (!nav.querySelector('.mobile-menu-close')) {
          const closeBtn = document.createElement('button');
          closeBtn.className = 'mobile-menu-close';
          closeBtn.innerHTML = '✕';
          closeBtn.setAttribute('aria-label', 'Close menu');
          closeBtn.addEventListener('click', closeMenu);
          nav.insertBefore(closeBtn, nav.firstChild);
        }
      }
    }
    
    if (toggle && nav && cta) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });
      
      // Close menu when clicking backdrop (outside menu)
      document.addEventListener('click', (e) => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        if (isOpen && !nav.contains(e.target) && !cta.contains(e.target) && !toggle.contains(e.target)) {
          closeMenu();
        }
      });
      
      // Close menu when clicking nav links
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          setTimeout(closeMenu, 150);
        });
      });
    }

    // Theme toggle with persistence
    const themeToggle = document.getElementById('themeToggle');
    
    function updateThemeButtonLabel() {
      if (!themeToggle) {
        console.warn('Theme toggle button not found');
        return;
      }
      const isDark = root.classList.contains('theme-dark');
      themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
      console.log('Theme button label updated:', themeToggle.textContent);
    }
    
    // Update button label on load
    updateThemeButtonLabel();

    // Add click event listener
    if (themeToggle) {
      console.log('Theme toggle button found, adding event listener');
      themeToggle.addEventListener('click', (e) => {
        console.log('Theme toggle clicked');
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle theme on both html and body to ensure it works
        root.classList.toggle('theme-dark');
        document.body.classList.toggle('theme-dark');
        
        const isDark = root.classList.contains('theme-dark');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('imngrd_theme', theme);
        updateThemeButtonLabel();
        
        console.log('Theme changed to:', theme);
        console.log('HTML classList:', root.className);
        console.log('Body classList:', document.body.className);
        
        // Send message to all iframes to update their theme
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          iframe.contentWindow.postMessage({ type: 'themeChange', theme: theme }, '*');
          console.log('Sent theme change message to iframe:', theme);
        });
      });
    } else {
      console.error('Theme toggle button not found - cannot add event listener');
    }

    // Handle window resize - close mobile menu and remove close button on desktop
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 900) {
          // Desktop view - close mobile menu and clean up
          closeMenu();
          const closeBtn = document.querySelector('.mobile-menu-close');
          if (closeBtn) {
            closeBtn.remove();
          }
          // Reset menu states
          if (nav) {
            nav.removeAttribute('data-open');
            nav.style.display = '';
          }
          if (cta) {
            cta.removeAttribute('data-open');
            cta.style.display = '';
          }
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
          }
          document.body.style.overflow = '';
        }
      }, 250);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();


