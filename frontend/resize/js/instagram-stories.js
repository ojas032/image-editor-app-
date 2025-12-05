/**
 * Instagram Stories page JavaScript functionality
 * Handles image resizing operations with Instagram Stories preset pre-selected
 */

(function () {
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

  // Instagram Stories page initialization
  function initInstagramStoriesPage() {
    console.log('Instagram Stories page initialized');

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

    // Add close button listener
    const successCloseBtn = document.getElementById('resizeSuccessClose');
    if (successCloseBtn) {
      successCloseBtn.addEventListener('click', () => {
        const successView = document.getElementById('resizeSuccessView');
        const dropZone = document.getElementById('resizeDropZone');
        const editorView = document.getElementById('resizeEditorView');

        if (successView) successView.style.display = 'none';
        if (editorView) editorView.style.display = 'none';
        if (dropZone) dropZone.style.display = 'flex';

        // Reset state
        const fileInput = document.getElementById('resizeFileInput');
        if (fileInput) fileInput.value = '';

        // Focus select button
        if (selectBtn) selectBtn.focus();
      });
    }

    // Initialize resize functionality with Instagram Stories preset
    setupInstagramStoriesFunctionality();
  }

  function setupInstagramStoriesFunctionality() {
    // Instagram Stories preset
    const INSTAGRAM_STORIES_PRESET = {
      name: 'Stories (1080 × 1920)',
      width: 1080,
      height: 1920
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

    // Update dimensions display for Instagram Stories
    function updateDimensionsDisplay() {
      const dimensionsEl = document.getElementById('resizeImageDimensions');
      if (dimensionsEl) {
        dimensionsEl.textContent = `Original: ${originalWidth} × ${originalHeight} → Instagram Stories: ${INSTAGRAM_STORIES_PRESET.width} × ${INSTAGRAM_STORIES_PRESET.height}`;
      }
    }

    // Handle export - resize to Instagram Stories dimensions using Canvas
    async function handleExport() {
      if (!currentBase64) {
        alert('Please select an image first.');
        return;
      }

      try {
        // Show processing overlay
        processingOverlay.style.display = 'flex';

        // Create an offscreen canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set dimensions
        const targetWidth = INSTAGRAM_STORIES_PRESET.width;
        const targetHeight = INSTAGRAM_STORIES_PRESET.height;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Load image
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = currentBase64;
        });

        // Calculate scaling to cover the area (center crop)
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.naturalWidth;
        let sourceHeight = img.naturalHeight;

        const targetRatio = targetWidth / targetHeight;
        const sourceRatio = sourceWidth / sourceHeight;

        if (sourceRatio > targetRatio) {
          // Source is wider than target - crop width
          const newSourceWidth = sourceHeight * targetRatio;
          sourceX = (sourceWidth - newSourceWidth) / 2;
          sourceWidth = newSourceWidth;
        } else {
          // Source is taller than target - crop height
          const newSourceHeight = sourceWidth / targetRatio;
          sourceY = (sourceHeight - newSourceHeight) / 2;
          sourceHeight = newSourceHeight;
        }

        // Draw to canvas with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw background (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        // Convert to blob/url
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

        // Hide processing overlay
        processingOverlay.style.display = 'none';

        // Show success view
        resizedImg.src = resizedDataUrl;
        successView.style.display = 'flex';

        // Set download link
        downloadBtn.href = resizedDataUrl;
        downloadBtn.download = `instagram-story-${Date.now()}.jpg`;

        // Update success dimensions
        const successDimensions = document.getElementById('resizeSuccessDimensions');
        if (successDimensions) {
          successDimensions.textContent = `Resized to: ${INSTAGRAM_STORIES_PRESET.width} × ${INSTAGRAM_STORIES_PRESET.height} pixels`;
        }

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
  window.initInstagramStoriesPage = initInstagramStoriesPage;

})();
