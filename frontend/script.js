(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Simple mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const cta = document.querySelector('.header-cta');
  if (toggle && nav && cta) {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      nav.toggleAttribute('data-open');
      cta.toggleAttribute('data-open');
      if (nav.hasAttribute('data-open')) {
        nav.style.display = 'flex';
        cta.style.display = 'flex';
      } else {
        nav.style.display = '';
        cta.style.display = '';
      }
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


