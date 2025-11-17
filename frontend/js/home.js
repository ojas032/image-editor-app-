/**
 * Home page JavaScript functionality
 * Handles any interactive elements specific to the home page
 */

(function() {
  'use strict';

  // Home page initialization
  function initHomePage() {
    // Add any home page specific initialization here
    console.log('Home page initialized');

    // Example: Add click tracking for hero buttons
    const heroButtons = document.querySelectorAll('.hero-actions .btn');
    heroButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        // Track analytics if needed
        console.log('Hero button clicked:', this.textContent.trim());
      });
    });
  }

  // Export for use in other modules
  window.initHomePage = initHomePage;

})();
