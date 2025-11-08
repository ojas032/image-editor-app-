(() => {
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
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('imngrd_theme') || 'light';
  if (storedTheme === 'dark') root.classList.add('theme-dark');
  updateThemeButtonLabel();

  themeToggle?.addEventListener('click', () => {
    root.classList.toggle('theme-dark');
    const isDark = root.classList.contains('theme-dark');
    localStorage.setItem('imngrd_theme', isDark ? 'dark' : 'light');
    updateThemeButtonLabel();
  });

  function updateThemeButtonLabel() {
    if (!themeToggle) return;
    const isDark = root.classList.contains('theme-dark');
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
})();


