/**
 * YouTube Thumbnail page JavaScript functionality
 * Handles image resizing operations with YouTube thumbnail preset pre-selected
 */

(function() {
  'use strict';

  const API_BASE = 'https://api.imagenerd.in';

  // Utility: Fetch with timeout
  async function fetchWithTimeout(url, options = {}, timeout = 20000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 20 seconds. Please try again.');
      }
      throw error;
    }
  }

  // Instagram Post page initialization
  function initInstagramPostPage() {
    console.log('YouTube Thumbnail page initialized');

    // Add title underline animation
    const titleSpan = document.querySelector('#resizeDropZone h2 span:first-child');
    if (titleSpan) {
      const underline = document.querySelector('.title-underline');
      if (underline) {
        titleSpan.addEventListener('mouseenter', () => {
          underline.style.transform = 'scaleX(1)';
        });
        titleSpan.addEventListener('mouseleave', () => {
          underline.style.transform = 'scaleX(0)';
        });
      }
    }

    // Add button hover effect
    const selectBtn = document.getElementById('resizeSelectBtn');
    if (selectBtn) {
      selectBtn.addEventListener('mouseenter', () => {
        const shimmer = selectBtn.querySelector('span:last-child');
        if (shimmer) shimmer.style.left = '100%';
      });
      selectBtn.addEventListener('mouseleave', () => {
        const shimmer = selectBtn.querySelector('span:last-child');
        if (shimmer) shimmer.style.left = '-100%';
      });
    }

    // Initialize resize functionality with YouTube preset
    setupYouTubeThumbnailFunctionality();
  }

  function setupYouTubeThumbnailFunctionality() {
    // Instagram Post preset
    const INSTAGRAM_POST_PRESET = {
      name: 'Post (1080 × 1080)',
      width: 1080,
      height: 1080
    };

    // Get DOM elements
    const fileInput = document.getElementById('resizeFileInput');
    const selectBtn = document.getElementById('resizeSelectBtn');
    const dropZone = document.getElementById('resizeDropZone');
    const editorView = document.getElementById('resizeEditorView');
    const canvasContainer = document.getElementById('resizeCanvasContainer');
    const previewImg = document.getElementById('resizePreviewImg');
    const processingOverlay = document.getElementById('resizeSpinnerOverlay');
    const successView = document.getElementById('resizeSuccessView');
    const resizedImg = document.getElementById('resizeResizedImg');
    const downloadBtn = document.getElementById('resizeDownloadBtn');
    const resizeAnotherBtn = document.getElementById('resizeAnotherBtn');
    const exportBtn = document.getElementById('resizeExportBtn');

    let currentFile = null;
    let currentBase64 = '';
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 1;

    // File selection
    selectBtn.addEventListener('click', () => fileInput.click());
    resizeAnotherBtn.addEventListener('click', resetToUploader);

    // Click on drop zone (excluding select button) to open file dialog
    dropZone.addEventListener('click', (e) => {
      if (!e.target.closest('#resizeSelectBtn')) {
        fileInput.click();
      }
    });

    // Keyboard navigation for drop zone
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    // Export button
    exportBtn.addEventListener('click', () => {
      // Show spinner overlay immediately when button is clicked
      document.getElementById('resizeSpinnerOverlay').style.display = 'flex';
      handleExport();
    });

    // Handle file selection
    async function handleFiles(files) {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }

      currentFile = file;

      try {
        // Handle HEIC files
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          const heic2any = window.heic2any;
          if (!heic2any) {
            throw new Error('HEIC support not available. Please try a different image format.');
          }
          const blob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          });
          currentFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        }

        // Convert to base64
        const base64 = await fileToBase64(currentFile);
        currentBase64 = base64;

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          originalWidth = img.naturalWidth;
          originalHeight = img.naturalHeight;
          aspectRatio = originalWidth / originalHeight;

          // Set preview image
          previewImg.src = base64;
          previewImg.style.maxWidth = '100%';
          previewImg.style.maxHeight = '400px';
          previewImg.style.objectFit = 'contain';

          // Switch to editor view
          dropZone.style.display = 'none';
          editorView.style.display = 'block';

          // Focus on export button for accessibility
          exportBtn.focus();

          updateDimensionsDisplay();
        };
        img.src = base64;

      } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file: ' + error.message);
      }
    }

    // Convert file to base64
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Update dimensions display for Instagram post
    function updateDimensionsDisplay() {
      const dimensionsEl = document.getElementById('resizeImageDimensions');
      if (dimensionsEl) {
        dimensionsEl.textContent = `Original: ${originalWidth} × ${originalHeight} → Instagram Post: ${INSTAGRAM_POST_PRESET.width} × ${INSTAGRAM_POST_PRESET.height}`;
      }
    }

    // Handle export - resize to YouTube thumbnail dimensions
    async function handleExport() {
      if (!currentBase64) {
        alert('Please select an image first.');
        return;
      }

      try {
        // Show processing overlay
        processingOverlay.style.display = 'flex';

        // Prepare request data
        const requestData = {
          image: currentBase64,
          width: INSTAGRAM_POST_PRESET.width,
          height: INSTAGRAM_POST_PRESET.height,
          format: 'jpeg',
          quality: 95
        };

        // Make API request
        const response = await fetchWithTimeout(`${API_BASE}/resize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();

        // Hide processing overlay
        processingOverlay.style.display = 'none';

        // Show success view
        resizedImg.src = result.image;
        successView.style.display = 'block';

        // Set download link
        downloadBtn.href = result.image;
        downloadBtn.download = `instagram-post-${Date.now()}.jpg`;

        // Update success dimensions
        const successDimensions = document.getElementById('resizeSuccessDimensions');
        if (successDimensions) {
          successDimensions.textContent = `Resized to: ${INSTAGRAM_POST_PRESET.width} × ${INSTAGRAM_POST_PRESET.height} pixels`;
        }

        // Scroll to success view
        successView.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Focus on download button
        downloadBtn.focus();

      } catch (error) {
        console.error('Resize error:', error);
        processingOverlay.style.display = 'none';
        alert('Error resizing image: ' + error.message);
      }
    }

    // Reset to uploader view
    function resetToUploader() {
      // Hide editor and success views
      editorView.style.display = 'none';
      successView.style.display = 'none';

      // Show drop zone
      dropZone.style.display = 'flex';

      // Reset file data
      currentFile = null;
      currentBase64 = '';
      originalWidth = 0;
      originalHeight = 0;
      aspectRatio = 1;

      // Clear preview
      previewImg.src = '';

      // Reset download link
      downloadBtn.href = '#';

      // Focus on select button
      selectBtn.focus();
    }

    // Initialize year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

// Make function globally available
window.initInstagramPostPage = initInstagramPostPage;

})();
