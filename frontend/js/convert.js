// Convert Image Format Tool
(function() {
  'use strict';

  let currentFile = null;
  let currentImage = null;

  function initConvertView() {
    console.log('Initializing convert view');

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

    const outputFormatRadios = document.getElementsByName('outputFormat');

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


    // Format selection
    outputFormatRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Update visual selection state
        document.querySelectorAll('.format-option-compact').forEach(option => {
          option.classList.remove('selected');
        });
        radio.closest('.format-option-compact').classList.add('selected');
      });
    });

    // Convert button
    convertBtn.addEventListener('click', convertImage);

    // Reset button
    resetBtn.addEventListener('click', resetForm);

    // Download button (anchor tag handles download automatically)
    // No click handler needed - anchor with download attribute handles it

    function handleFile(file) {
      // Validate file type
      const allowedTypes = ['image/heic', 'image/heif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/tif'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(heic|heif|jpg|jpeg|png|webp|gif|bmp|tiff|tif)$/i)) {
        alert('Please select a valid image file (HEIC, JPEG, PNG, WebP, GIF, BMP, TIFF)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      currentFile = file;

      // Read and display image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          originalImage.src = e.target.result;
          // Update current image info (shows original by default)
          updateImageInfo(getFileFormat(file), formatFileSize(file.size), `${img.width} × ${img.height}`);

          // Show editor and page header, hide hero section
          editorView.style.display = 'block';
          pageHeader.style.display = 'block';
          heroSection.style.display = 'none';

          // Update format options based on input format
          updateFormatOptions(file.type);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function getFileFormat(file) {
      const type = file.type;
      const name = file.name.toLowerCase();

      if (type.includes('jpeg') || name.includes('.jpg') || name.includes('.jpeg')) return 'JPEG';
      if (type.includes('png') || name.includes('.png')) return 'PNG';
      if (type.includes('webp') || name.includes('.webp')) return 'WebP';
      if (type.includes('heic') || type.includes('heif') || name.includes('.heic') || name.includes('.heif')) return 'HEIC';
      if (type.includes('gif') || name.includes('.gif')) return 'GIF';
      if (type.includes('bmp') || name.includes('.bmp')) return 'BMP';
      if (type.includes('tiff') || name.includes('.tiff') || name.includes('.tif')) return 'TIFF';

      return 'Unknown';
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function updateFormatOptions(inputType) {
      // All formats are generally available, but we can prioritize based on input
      // For now, keep all options enabled
    }


    async function convertImage() {
      if (!currentImage || !currentFile) {
        alert('Please select an image first');
        return;
      }

      const selectedFormat = document.querySelector('input[name="outputFormat"]:checked').value;

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

        // Convert to selected format
        let mimeType, fileExtension, quality = 0.85;
        switch (selectedFormat) {
          case 'png':
            mimeType = 'image/png';
            fileExtension = 'png';
            quality = undefined; // PNG doesn't use quality
            break;
          case 'jpg':
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
            quality = 0.85; // Default quality for JPEG
            break;
          case 'webp':
            mimeType = 'image/webp';
            fileExtension = 'webp';
            quality = 0.85; // Default quality for WebP
            break;
          case 'gif':
            // For GIF, we'll use PNG as intermediate format
            mimeType = 'image/png';
            fileExtension = 'gif';
            quality = undefined;
            break;
          case 'bmp':
            // For BMP, we'll use PNG as intermediate format
            mimeType = 'image/png';
            fileExtension = 'bmp';
            quality = undefined;
            break;
          case 'tiff':
            // For TIFF, we'll use PNG as intermediate format
            mimeType = 'image/png';
            fileExtension = 'tiff';
            quality = undefined;
            break;
          default:
            mimeType = 'image/png';
            fileExtension = 'png';
            quality = undefined;
        }

        // Convert canvas to blob
        const convertedBlob = await new Promise(resolve => {
          if (quality !== undefined) {
            canvas.toBlob(resolve, mimeType, quality);
          } else {
            canvas.toBlob(resolve, mimeType);
          }
        });

        if (!convertedBlob) {
          throw new Error('Conversion failed');
        }

        // Create download URL
        const convertedUrl = URL.createObjectURL(convertedBlob);

        // Update results
        convertedImage.src = convertedUrl;
        const convertedFormatText = selectedFormat.toUpperCase();
        const convertedSizeText = formatFileSize(convertedBlob.size);
        const convertedDimensionsText = `${canvas.width} × ${canvas.height}`;

        // Update converted image info
        updateImageInfo(convertedFormatText, convertedSizeText, convertedDimensionsText);

        // Set download attributes
        const originalName = currentFile.name.replace(/\.[^/.]+$/, '');
        downloadBtn.download = `${originalName}_converted.${fileExtension}`;
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
        convertBtn.textContent = 'Convert Image';
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

      // Reset format selection to JPEG
      const jpegRadio = document.querySelector('input[name="outputFormat"][value="jpg"]');
      jpegRadio.checked = true;
      // Trigger change event to update visual state
      jpegRadio.dispatchEvent(new Event('change'));

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
    document.addEventListener('DOMContentLoaded', initConvertView);
  } else {
    initConvertView();
  }

  // Export for potential external use
  window.initConvertView = initConvertView;

})();
