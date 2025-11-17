/**
 * Contact page JavaScript functionality
 * Handles the contact form submission
 */

(function() {
  'use strict';

  // Contact page initialization
  function initContactPage() {
    console.log('Contact page initialized');

    // Set up contact form
    setupContactForm();

    // Set up responsive contact grid
    setupResponsiveGrid();
  }

  function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (!contactForm) {
      console.warn('Contact form not found');
      return;
    }

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      // Show loading state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        // For demo purposes, we'll simulate a successful submission
        // In a real implementation, you'd send this to your backend
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

        formMessage.innerHTML = `
          <div style="padding: 16px; background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; color: #065f46;">
            <strong>✓ Message sent successfully!</strong><br>
            Thank you for contacting us. We'll get back to you within 24 hours.
          </div>
        `;
        formMessage.style.display = 'block';
        contactForm.reset();

      } catch (error) {
        formMessage.innerHTML = `
          <div style="padding: 16px; background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; color: #991b1b;">
            <strong>✗ Failed to send message.</strong><br>
            Please try again later or contact us directly at support@imagenerd.in
          </div>
        `;
        formMessage.style.display = 'block';
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  function setupResponsiveGrid() {
    // Responsive contact grid
    function updateContactGrid() {
      const contactGrid = document.getElementById('contactGrid');
      if (contactGrid) {
        if (window.innerWidth < 768) {
          contactGrid.style.gridTemplateColumns = '1fr';
        } else {
          contactGrid.style.gridTemplateColumns = '1fr 1fr';
        }
      }
    }

    // Update on load and resize
    updateContactGrid();
    window.addEventListener('resize', updateContactGrid);
  }

  // Export for use in other modules
  window.initContactPage = initContactPage;

})();
