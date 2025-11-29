/**
 * Resize page JavaScript functionality
 * Handles image resizing operations
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

  // Resize page initialization
  function initResizePage() {
    console.log('Resize page initialized');

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

    // Initialize resize functionality
    setupResizeFunctionality();
  }

  function setupResizeFunctionality() {
    const SOCIAL_PRESETS = {
      youtube: [
        { name: 'Thumbnail (1280 × 720)', width: 1280, height: 720 },
        { name: 'Channel Cover (2560 × 1440)', width: 2560, height: 1440 },
        { name: 'Channel Profile (800 × 800)', width: 800, height: 800 },
        { name: 'Stories (1080 × 1920)', width: 1080, height: 1920 }
      ],
      instagram: [
        { name: 'Post Square (1080 × 1080)', width: 1080, height: 1080 },
        { name: 'Post Portrait (1080 × 1350)', width: 1080, height: 1350 },
        { name: 'Story/Reels (1080 × 1920)', width: 1080, height: 1920 }
      ],
      facebook: [
        { name: 'Post (1200 × 630)', width: 1200, height: 630 },
        { name: 'Story (1080 × 1920)', width: 1080, height: 1920 }
      ],
      twitter: [{ name: 'Post (1200 × 675)', width: 1200, height: 675 }],
      linkedin: [{ name: 'Post (1200 × 627)', width: 1200, height: 627 }],
      tiktok: [{ name: 'Video (1080 × 1920)', width: 1080, height: 1920 }],
      pinterest: [{ name: 'Pin (1000 × 1500)', width: 1000, height: 1500 }]
    };

    // Get DOM elements
    const fileInput = document.getElementById('resizeFileInput');
    const selectBtn = document.getElementById('resizeSelectBtn');
    const dropZone = document.getElementById('resizeDropZone');
    const editorView = document.getElementById('resizeEditorView');
    const canvasContainer = document.getElementById('resizeCanvasContainer');
    const previewImg = document.getElementById('resizePreviewImg');
    const processingOverlay = document.getElementById('resizeProcessingOverlay');
    const successView = document.getElementById('resizeSuccessView');
    const resizedImg = document.getElementById('resizeResizedImg');
    const downloadBtn = document.getElementById('resizeDownloadBtn');
    const resizeAnotherBtn = document.getElementById('resizeAnotherBtn');
    const exportBtn = document.getElementById('resizeExportBtn');

    // Controls
    const methodSelect = document.getElementById('resizeMethodSelect');
    const platformSelect = document.getElementById('resizePlatformSelect');
    const presetTypeContainer = document.getElementById('resizePresetTypeContainer');
    const presetTypeSelect = document.getElementById('resizePresetTypeSelect');
    const widthInput = document.getElementById('resizeWidthInput');
    const heightInput = document.getElementById('resizeHeightInput');
    const percentInput = document.getElementById('resizePercentInput');
    const lockAspectRatio = document.getElementById('resizeLockAspectRatio');
    const finalWidthDisplay = document.getElementById('resizeFinalWidthDisplay');
    const finalHeightDisplay = document.getElementById('resizeFinalHeightDisplay');
    const dimensionsDisplay = document.getElementById('resizeDimensionsDisplay');

    // Social media options
    const socialMediaOptions = document.getElementById('resizeSocialMediaOptions');
    const bySizeOptions = document.getElementById('resizeBySizeOptions');
    const byPercentOptions = document.getElementById('resizeByPercentOptions');

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

    // Method selection
    methodSelect.addEventListener('change', updateUIForMethod);

    // Platform selection
    platformSelect.addEventListener('change', () => {
      const platform = platformSelect.value;
      if (SOCIAL_PRESETS[platform]) {
        presetTypeContainer.style.display = 'block';
        presetTypeSelect.innerHTML = '';
        SOCIAL_PRESETS[platform].forEach((preset, idx) => {
          const option = document.createElement('option');
          option.value = idx;
          option.textContent = preset.name;
          presetTypeSelect.appendChild(option);
        });
        updateDimensionsDisplay();
        updatePresetDimensions();
      }
    });

    // Preset selection
    presetTypeSelect.addEventListener('change', () => {
      updateDimensionsDisplay();
      updatePresetDimensions();
    });

    // Size inputs
    widthInput.addEventListener('input', () => {
      if (lockAspectRatio.checked && originalWidth > 0) {
        heightInput.value = Math.round(parseInt(widthInput.value) / aspectRatio);
      }
      updateDimensionsDisplay();
      updateAspectRatioDisplay();
    });

    heightInput.addEventListener('input', () => {
      if (lockAspectRatio.checked && originalHeight > 0) {
        widthInput.value = Math.round(parseInt(heightInput.value) * aspectRatio);
      }
      updateDimensionsDisplay();
      updateAspectRatioDisplay();
    });

    percentInput.addEventListener('input', updateDimensionsDisplay);

    // Export button
    exportBtn.addEventListener('click', () => {
      // Show spinner overlay immediately when button is clicked
      document.getElementById('resizeSpinnerOverlay').style.display = 'flex';
      handleExport();
    });

    function handleFiles(list) {
      const files = Array.from(list || []).filter(f => /^image\//.test(f.type));
      if (!files.length) {
        alert('Please select a valid image file.');
        return;
      }

      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10 MB limit. Please choose a smaller file.');
        return;
      }

      // Validate format
      const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isValidFormat = validFormats.includes(file.type) || ['heic', 'heif'].includes(fileExtension);

      if (!isValidFormat) {
        alert('Unsupported format. Please upload HEIC, JPEG, PNG, WebP, GIF, BMP, or TIFF.');
        return;
      }

      processFile(file);
    }

    async function processFile(file) {
      currentFile = file;

      // Check if file is HEIC/HEIF and convert if needed
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isHeic = ['heic', 'heif'].includes(fileExtension) || ['image/heic', 'image/heif'].includes(file.type);

      try {
        let imageBlob = file;

        if (isHeic && window.heic2any) {
          // Convert HEIC to a browser-compatible format
          imageBlob = await window.heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.92
          });
        }

        // Generate base64 from the processed image (original file or converted HEIC)
        currentBase64 = await fileToBase64(imageBlob);

        const objectUrl = URL.createObjectURL(imageBlob);

        // Set the image source
        previewImg.src = objectUrl;

        // Show editor view
        dropZone.style.display = 'none';
        editorView.style.display = 'block';
        canvasContainer.style.display = 'block';
        successView.style.display = 'none';
        document.getElementById('resizeSpinnerOverlay').style.display = 'none';

        // Initialize image when loaded
        previewImg.onload = () => {
          originalWidth = previewImg.naturalWidth;
          originalHeight = previewImg.naturalHeight;
          aspectRatio = originalWidth / originalHeight;

          document.getElementById('resizeImageDimensions').textContent = `Original: ${originalWidth} × ${originalHeight} pixels`;

          // Set initial values
          widthInput.value = originalWidth;
          heightInput.value = originalHeight;

          // Update UI
          updateUIForMethod();
          updateAspectRatioDisplay();
          platformSelect.dispatchEvent(new Event('change'));

          URL.revokeObjectURL(objectUrl);
        };

        previewImg.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          document.getElementById('resizeSpinnerOverlay').style.display = 'none';
          alert('Unable to load that image. Please try another file.');
        };
      } catch (error) {
        console.error('Error processing image:', error);
        document.getElementById('resizeSpinnerOverlay').style.display = 'none';
        alert('Unable to process that image. Please try another file.');
      }
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function updateUIForMethod() {
      const method = methodSelect.value;
      socialMediaOptions.style.display = method === 'socialMedia' ? 'block' : 'none';
      bySizeOptions.style.display = method === 'bySize' ? 'block' : 'none';
      byPercentOptions.style.display = method === 'byPercent' ? 'block' : 'none';

      // Update method description
      updateMethodDescription(method);

      updateDimensionsDisplay();
    }

    function updateMethodDescription(method) {
      const methodDescription = document.getElementById('methodDescription');
      if (!methodDescription) return;

      const descriptions = {
        socialMedia: 'Perfect dimensions for social platforms',
        bySize: 'Set exact pixel dimensions',
        byPercent: 'Scale by percentage of original'
      };

      methodDescription.textContent = descriptions[method] || '';
    }

    function updatePresetDimensions() {
      const presetDimensions = document.getElementById('presetDimensions');
      if (!presetDimensions) return;

      const platform = platformSelect.value;
      const presetIdx = parseInt(presetTypeSelect.value || 0);

      if (SOCIAL_PRESETS[platform] && SOCIAL_PRESETS[platform][presetIdx]) {
        const preset = SOCIAL_PRESETS[platform][presetIdx];
        presetDimensions.textContent = `${preset.width} × ${preset.height} pixels`;
      } else {
        presetDimensions.textContent = 'Select a preset to see dimensions';
      }
    }

    function updateAspectRatioDisplay() {
      const aspectRatioDisplay = document.getElementById('currentAspectRatio');
      if (!aspectRatioDisplay) return;

      if (originalWidth > 0 && originalHeight > 0) {
        // Calculate and display aspect ratio
        const ratio = originalWidth / originalHeight;
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(originalWidth, originalHeight);
        const simplifiedWidth = originalWidth / divisor;
        const simplifiedHeight = originalHeight / divisor;

        aspectRatioDisplay.textContent = `Ratio: ${simplifiedWidth}:${simplifiedHeight} (${ratio.toFixed(2)}:1)`;
      } else {
        aspectRatioDisplay.textContent = 'Ratio: Auto';
      }
    }

    function updateDimensionsDisplay() {
      const method = methodSelect.value;

      if (method === 'socialMedia') {
        const platform = platformSelect.value;
        const presetIdx = parseInt(presetTypeSelect.value || 0);
        if (SOCIAL_PRESETS[platform] && SOCIAL_PRESETS[platform][presetIdx]) {
          const preset = SOCIAL_PRESETS[platform][presetIdx];
          finalWidthDisplay.value = preset.width;
          finalHeightDisplay.value = preset.height;
          dimensionsDisplay.style.display = 'block';
        }
      } else if (method === 'bySize') {
        const w = parseInt(widthInput.value);
        const h = parseInt(heightInput.value);
        if (w > 0 && h > 0) {
          finalWidthDisplay.value = w;
          finalHeightDisplay.value = h;
          dimensionsDisplay.style.display = 'block';
        }
      } else if (method === 'byPercent') {
        const percent = parseFloat(percentInput.value);
        if (percent > 0 && originalWidth > 0) {
          finalWidthDisplay.value = Math.round(originalWidth * (percent / 100));
          finalHeightDisplay.value = Math.round(originalHeight * (percent / 100));
          dimensionsDisplay.style.display = 'block';
        }
      }
    }

    async function resizeImageFrontend(base64Data, targetWidth, targetHeight) {
      return new Promise((resolve, reject) => {
        // Create a new image element
        const img = new Image();

        img.onload = () => {
          try {
            // Create canvas with target dimensions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size to target dimensions
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Enable high-quality image rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw the image onto the canvas with the new dimensions
            // This will automatically resize the image using bilinear interpolation
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Convert canvas to base64
            // Use the same format as the original image when possible
            const mimeType = currentFile.type || 'image/png';
            const resizedBase64 = canvas.toDataURL(mimeType, 0.92).split(',')[1];

            resolve(resizedBase64);
          } catch (error) {
            reject(new Error('Failed to resize image: ' + error.message));
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image for resizing'));
        };

        // Set the image source to the base64 data
        img.src = `data:${currentFile.type || 'image/png'};base64,${base64Data}`;
      });
    }

    async function handleExport() {
      if (!currentFile || !currentBase64) {
        document.getElementById('resizeSpinnerOverlay').style.display = 'none';
        alert('Please select an image first');
        return;
      }

      let targetWidth, targetHeight;
      const method = methodSelect.value;

      if (method === 'bySize') {
        targetWidth = parseInt(widthInput.value);
        targetHeight = parseInt(heightInput.value);
      } else if (method === 'byPercent') {
        const percent = parseFloat(percentInput.value);
        targetWidth = Math.round(originalWidth * (percent / 100));
        targetHeight = Math.round(originalHeight * (percent / 100));
      } else if (method === 'socialMedia') {
        const platform = platformSelect.value;
        const presetIdx = parseInt(presetTypeSelect.value || 0);
        if (SOCIAL_PRESETS[platform] && SOCIAL_PRESETS[platform][presetIdx]) {
          const preset = SOCIAL_PRESETS[platform][presetIdx];
          targetWidth = preset.width;
          targetHeight = preset.height;
        }
      }

      if (!targetWidth || !targetHeight) {
        document.getElementById('resizeSpinnerOverlay').style.display = 'none';
        alert('Invalid dimensions');
        return;
      }

      // Show spinner overlay on image (keep image and controls visible)
      successView.style.display = 'none';

      try {
        // Resize image using client-side canvas
        const resizedBase64 = await resizeImageFrontend(currentBase64, targetWidth, targetHeight);

        const mimeType = currentFile.type || 'image/png';
        const fileExt = mimeType.split('/')[1] || 'png';
        const downloadUrl = `data:${mimeType};base64,${resizedBase64}`;
        resizedImg.src = downloadUrl;

        document.getElementById('resizeSuccessDimensions').textContent = `Resized to: ${targetWidth} × ${targetHeight} pixels`;

        // Setup download
        downloadBtn.href = downloadUrl;
        const baseName = (currentFile.name || 'image').replace(/\.[^.]+$/, '');
        downloadBtn.download = `${baseName}-resized.${fileExt}`;

        // Show success view
        document.getElementById('resizeSpinnerOverlay').style.display = 'none';
        successView.style.display = 'flex';

      } catch (err) {
        console.error('Resize error:', err);
        document.getElementById('resizeSpinnerOverlay').style.display = 'none';
        alert('Failed to resize image: ' + err.message);
      }
    }

    function resetToUploader() {
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      canvasContainer.style.display = 'block';
      successView.style.display = 'none';
      document.querySelectorAll('.control-card').forEach(card => card.style.display = 'block');
      document.getElementById('resizeSpinnerOverlay').style.display = 'none';
      fileInput.value = '';
      currentFile = null;
      currentBase64 = '';
    }
  }

  // Export for use in other modules
  window.initResizePage = initResizePage;

})();

