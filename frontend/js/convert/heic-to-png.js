// HEIC to PNG Converter Tool
(function() {
  'use strict';

  let currentFile = null;
  let currentImage = null;

  function initHeicToPngView() {
    console.log('Initializing HEIC to PNG view');

    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const editorView = document.getElementById('editorView');
    const heroSection = document.querySelector('.hero-section');
    const pageHeader = document.getElementById('pageHeader');

    const originalImage = document.getElementById('originalImage');
    const convertedImage = document.getElementById('convertedImage');

    // Single image info element (replaces separate original/converted info)
    const currentFormat = document.getElementById('currentFormat');
    const currentSize = document.getElementById('currentSize');
    const currentDimensions = document.getElementById('currentDimensions');

    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Tab elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const originalWrapper = document.getElementById('originalWrapper');
    const convertedWrapper = document.getElementById('convertedWrapper');
    const convertedPlaceholder = document.getElementById('convertedPlaceholder');

    // Event listeners
    selectBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    // Store image info for both tabs
    let originalImageInfo = { format: '', size: '', dimensions: '' };
    let convertedImageInfo = { format: '', size: '', dimensions: '' };

    // Tab switching
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update tab states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Switch image display
        if (tab === 'original') {
          originalWrapper.classList.remove('hidden');
          convertedWrapper.classList.add('hidden');
          updateImageInfo(originalImageInfo.format, originalImageInfo.size, originalImageInfo.dimensions);
        } else {
          originalWrapper.classList.add('hidden');
          convertedWrapper.classList.remove('hidden');
          updateImageInfo(convertedImageInfo.format, convertedImageInfo.size, convertedImageInfo.dimensions);
        }
      });
    });

    function updateImageInfo(format, size, dimensions) {
      currentFormat.textContent = format;
      currentSize.textContent = size;
      currentDimensions.textContent = dimensions;

      // Store current values for the active tab
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab && activeTab.dataset.tab === 'original') {
        originalImageInfo = { format, size, dimensions };
      } else if (activeTab && activeTab.dataset.tab === 'converted') {
        convertedImageInfo = { format, size, dimensions };
      }
    }

    // Convert button
    convertBtn.addEventListener('click', convertImage);

    // Reset button
    resetBtn.addEventListener('click', resetForm);

    // Download button (anchor tag handles download automatically)
    // No click handler needed - anchor with download attribute handles it

    function handleFile(file) {
      // Validate file type - only accept HEIC
      const allowedTypes = ['image/heic', 'image/heif'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/('..heic', '..heif')$/i)) {
        alert('Please select a valid HEIC image file (.heic, .heif)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      currentFile = file;

      // Handle HEIC conversion first
      heic2any({ blob: file, toType: 'image/png' })
        .then(convertedBlob => {
          const convertedFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' });
          processImageFile(convertedFile);
        })
        .catch(error => {
          console.error('HEIC conversion error:', error);
          alert('Failed to process HEIC file. Please try a different image.');
        });
    }

    function processImageFile(file) {

      // Read and display image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          originalImage.src = e.target.result;
          // Update current image info (shows original by default)
          updateImageInfo('HEIC', formatFileSize(file.size), `${img.width} × ${img.height}`);

          // Show editor and page header, hide hero section
          editorView.style.display = 'block';
          pageHeader.style.display = 'block';
          heroSection.style.display = 'none';
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function convertImage() {
      if (!currentImage || !currentFile) {
        alert('Please select a HEIC image first');
        return;
      }

      try {
        // Show processing state
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        // Create canvas for conversion
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = currentImage.width;
        canvas.height = currentImage.height;

        // Draw image to canvas
        ctx.drawImage(currentImage, 0, 0);

        // Convert to PNG
        const convertedBlob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/png', undefined);
        });

        if (!convertedBlob) {
          throw new Error('Conversion failed');
        }

        // Create download URL
        const convertedUrl = URL.createObjectURL(convertedBlob);

        // Update results
        convertedImage.src = convertedUrl;
        const convertedFormatText = 'PNG';
        const convertedSizeText = formatFileSize(convertedBlob.size);
        const convertedDimensionsText = `${canvas.width} × ${canvas.height}`;

        // Update converted image info
        updateImageInfo(convertedFormatText, convertedSizeText, convertedDimensionsText);

        // Set download attributes
        const originalName = currentFile.name.replace(/\.[^/.]+$/, '');
        downloadBtn.download = `${originalName}.png`;
        downloadBtn.href = convertedUrl;

        // Hide placeholder and switch to converted tab, show download button
        convertedPlaceholder.style.display = 'none';
        tabBtns.forEach(btn => {
          if (btn.dataset.tab === 'converted') {
            btn.click();
          }
        });
        downloadBtn.classList.remove('hidden');

      } catch (error) {
        console.error('Conversion error:', error);
        alert('Failed to convert image: ' + error.message);
      } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert to PNG';
      }
    }

    function resetForm() {
      // Reset all states
      currentFile = null;
      currentImage = null;

      fileInput.value = '';

      // Hide editor and page header, show hero section
      editorView.style.display = 'none';
      pageHeader.style.display = 'none';
      heroSection.style.display = 'block';

      // Reset tab to original
      tabBtns.forEach(btn => {
        if (btn.dataset.tab === 'original') {
          btn.click();
        }
      });

      // Hide download button and show placeholder
      downloadBtn.classList.add('hidden');
      convertedPlaceholder.style.display = 'block';

      // Clear converted image and reset info
      convertedImage.src = '';
      originalImageInfo = { format: '', size: '', dimensions: '' };
      convertedImageInfo = { format: '', size: '', dimensions: '' };
      updateImageInfo('', '', '');
    }

    function downloadImage() {
      // Download is handled by the anchor tag
      // Clean up the object URL after download
      setTimeout(() => {
        if (downloadBtn.href.startsWith('blob:')) {
          URL.revokeObjectURL(downloadBtn.href);
        }
      }, 1000);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeicToPngView);
  } else {
    initHeicToPngView();
  }

  // Export for potential external use
  window.initHeicToPngView = initHeicToPngView;

})();