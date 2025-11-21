// Convert Image Format Tool - Main Page
(function() {
  'use strict';

  // API endpoint configuration
  const API_BASE = 'https://api.imagenerd.in'; // Production API endpoint

  let currentFile = null;
  let currentImage = null;
  let isImageLoaded = false;
  let originalCanvas = null;

  function initConvertView() {
    console.log('Initializing convert view');

    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const dropZone = document.getElementById('dropZone');
    const editorView = document.getElementById('editorView');
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = document.getElementById('cropCanvas');
    const imageDimensions = document.getElementById('imageDimensions');
    const editorProcessingOverlay = document.getElementById('editorProcessingOverlay');
    const successView = document.getElementById('successView');
    const convertedImage = document.getElementById('convertedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertAnotherBtn = document.getElementById('convertAnotherBtn');
    const convertBtn = document.getElementById('convertBtn');

    // Controls


    // File selection
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Create a new file input element to avoid click() issues with hidden elements
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.accept = '.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,image/*';
      tempInput.style.display = 'none';
      tempInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
        document.body.removeChild(tempInput);
      });
      document.body.appendChild(tempInput);
      tempInput.click();
    });

    convertAnotherBtn.addEventListener('click', resetToUploader);

    // Reset button (only exists in main convert.html, not individual pages)
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetToUploader);
    }

    // Click on drop zone (excluding select button) to open file dialog
    dropZone.addEventListener('click', (e) => {
      // Only trigger if not clicking on the select button or its children
      if (!e.target.closest('#selectBtn')) {
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = '.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,image/*';
        tempInput.style.display = 'none';
        tempInput.addEventListener('change', (event) => {
          handleFiles(event.target.files);
          document.body.removeChild(tempInput);
        });
        document.body.appendChild(tempInput);
        tempInput.click();
      }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag');
      handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    // Format selection
    const formatRadios = document.querySelectorAll('input[name="outputFormat"]');
    formatRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Remove selected class from all cards
        document.querySelectorAll('.format-option-card').forEach(card => {
          card.classList.remove('selected');
        });
        // Add selected class to the checked card's parent
        if (radio.checked) {
          radio.closest('.format-option-card').classList.add('selected');
        }
      });
    });

    // Set initial selected state for JPEG (default)
    setTimeout(() => {
      const defaultRadio = document.querySelector('input[name="outputFormat"][value="jpg"]');
      if (defaultRadio) {
        defaultRadio.closest('.format-option-card').classList.add('selected');
      }
    }, 100);

    // Convert button
    convertBtn.addEventListener('click', handleConvert);

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
      // Also check file extension for HEIC (some browsers don't set proper MIME type)
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
      currentImage = await fileToBase64(file);

      // Check if this is a TIFF file (not supported by canvas)
      const isTiff = file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif');

      // Disable convert button while loading
      convertBtn.disabled = true;
      // Update the text node (skip the emoji span)
      const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (textNode) textNode.textContent = ' Loading...';
      isImageLoaded = false;

      if (isTiff) {
        // For TIFF files, skip canvas loading and go directly to ready state
        console.log('TIFF file detected, skipping canvas preview');
        isImageLoaded = true;
        originalCanvas = { width: 0, height: 0 }; // Placeholder dimensions

        // Update dimensions display
        imageDimensions.textContent = `Original: TIFF file • Dimensions unavailable in preview`;

        // Enable convert button immediately
        convertBtn.disabled = false;
        const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.textContent = ' Convert Format';

        // Show editor view without canvas
        dropZone.style.display = 'none';
        editorView.style.display = 'block';
        canvasContainer.style.display = 'none'; // Hide canvas for TIFF

        // Add a placeholder message for TIFF files
        const tiffPlaceholder = document.createElement('div');
        tiffPlaceholder.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 12px;
          border: 2px dashed #d1d5db;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        `;
        tiffPlaceholder.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">📄</div>
            <div>TIFF File Loaded</div>
            <div style="font-size: 14px; margin-top: 4px; opacity: 0.8;">Ready for conversion</div>
          </div>
        `;

        // Insert placeholder where canvas would be
        const editorCanvasSection = document.querySelector('.editor-canvas-section');
        if (editorCanvasSection) {
          const canvasContainer = document.getElementById('canvasContainer');
          editorCanvasSection.insertBefore(tiffPlaceholder, canvasContainer);
        }

        successView.style.display = 'none';
        editorProcessingOverlay.style.display = 'none';
        return; // Exit early for TIFF files
      }

      const objectUrl = URL.createObjectURL(file);

      // Handle image load - set this BEFORE setting src
      canvas.onload = () => {
        isImageLoaded = true;
        originalCanvas = canvas;

        // Update dimensions display
        const naturalWidth = canvas.naturalWidth;
        const naturalHeight = canvas.naturalHeight;
        imageDimensions.textContent = `Original: ${naturalWidth} × ${naturalHeight} pixels`;

        // Enable convert button now that image is loaded
        convertBtn.disabled = false;
        // Update the text node back to "Convert Format"
        const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.textContent = ' Convert Format';

        URL.revokeObjectURL(objectUrl);
      };

      // Set the image source
      canvas.src = objectUrl;

      // Show editor view
      dropZone.style.display = 'none';
      editorView.style.display = 'block';
      canvasContainer.style.display = 'block';
      successView.style.display = 'none';
      editorProcessingOverlay.style.display = 'none';

      // Check if image is already loaded immediately after setting src
      setTimeout(() => {
        if (canvas.complete && canvas.naturalWidth > 0 && !isImageLoaded) {
          canvas.onload();
        }
      }, 10);

      // Fallback timeout in case onload never fires
      setTimeout(() => {
        if (!isImageLoaded) {
          isImageLoaded = true;
          convertBtn.disabled = false;
          const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          if (textNode) textNode.textContent = ' Convert Format';
        }
      }, 5000);

      canvas.onerror = () => {
        console.error('Canvas failed to load image');
        URL.revokeObjectURL(objectUrl);
        // Re-enable convert button on error
        convertBtn.disabled = false;
        // Update the text node back to "Convert Format"
        const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.textContent = ' Convert Format';
        isImageLoaded = false;
        alert('Unable to load that image. Please try another file.');
      };
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function base64ToBlob(base64String, format) {
      // Determine MIME type based on format
      let mimeType;
      switch (format) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
          mimeType = 'image/jpeg';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'bmp':
          mimeType = 'image/bmp';
          break;
        case 'tiff':
          mimeType = 'image/tiff';
          break;
        default:
          mimeType = 'image/png';
      }

      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    }

    async function handleConvert() {
      if (!isImageLoaded || !currentFile) {
        alert('Please select an image first');
        return;
      }

      const selectedFormat = document.querySelector('input[name="outputFormat"]:checked').value;

      // Show processing overlay
      canvasContainer.style.display = 'none';
      imageDimensions.style.display = 'none';
      document.querySelectorAll('.control-card').forEach(card => card.style.display = 'none');
      editorProcessingOverlay.style.display = 'flex';
      successView.style.display = 'none';

      try {
        // Prepare the request data
        const requestData = {
          image_base64: currentImage,
          format: selectedFormat
        };

        // Call the backend API
        const response = await fetch(`${API_BASE}/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Conversion failed');
        }

        const result = await response.json();

        if (!result.converted_image_base64) {
          throw new Error('Invalid response from server: missing converted_image_base64');
        }

        // Convert the base64 response back to a blob
        const convertedBlob = base64ToBlob(result.converted_image_base64, selectedFormat);

        if (!convertedBlob || !convertedBlob.type) {
          throw new Error('Failed to create blob from server response');
        }

        // Create download URL
        const downloadUrl = URL.createObjectURL(convertedBlob);

        // Update success view
        convertedImage.src = downloadUrl;

        const fileSize = formatFileSize(convertedBlob.size);
        const actualFormat = convertedBlob.type.split('/')[1].toUpperCase();

        // Handle TIFF files specially (no preview dimensions)
        const dimensionsText = (originalCanvas.width === 0 && originalCanvas.height === 0)
          ? 'TIFF file converted'
          : `${originalCanvas.width} × ${originalCanvas.height} pixels`;

        document.getElementById('successDimensions').textContent =
          `Converted to ${actualFormat} • ${dimensionsText} • ${fileSize}`;

        // Determine file extension based on format
        let fileExtension;
        switch (selectedFormat) {
          case 'png':
            fileExtension = 'png';
            break;
          case 'jpg':
            fileExtension = 'jpg';
            break;
          case 'webp':
            fileExtension = 'webp';
            break;
          case 'gif':
            fileExtension = 'gif';
            break;
          case 'bmp':
            fileExtension = 'bmp';
            break;
          case 'tiff':
            fileExtension = 'tiff';
            break;
          default:
            fileExtension = 'png';
        }

        // Setup download
        const baseName = (currentFile.name || 'image').replace(/\.[^.]+$/, '');
        downloadBtn.href = downloadUrl;
        downloadBtn.download = `${baseName}_converted.${fileExtension}`;

        // Show success view
        editorProcessingOverlay.style.display = 'none';
        successView.style.display = 'flex';

      } catch (error) {
        console.error('Conversion error:', error);
        alert('Failed to convert image: ' + error.message);
        // Reset view
        editorProcessingOverlay.style.display = 'none';
        canvasContainer.style.display = 'block';
        document.querySelectorAll('.control-card').forEach(card => card.style.display = 'block');
      }
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function resetToUploader() {
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      canvasContainer.style.display = 'block';
      successView.style.display = 'none';
      editorProcessingOverlay.style.display = 'none';
      imageDimensions.style.display = 'block';
      document.querySelectorAll('.control-card').forEach(card => card.style.display = 'block');

      // Remove any TIFF placeholder
      const tiffPlaceholder = document.querySelector('.editor-canvas-section > div[style*="TIFF File Loaded"]');
      if (tiffPlaceholder) {
        tiffPlaceholder.remove();
      }

      fileInput.value = '';
      currentFile = null;
      currentImage = null;
      isImageLoaded = false;
      originalCanvas = null;

      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reset button state
      convertBtn.disabled = false;
      // Update the text node back to "Convert Format"
      const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (textNode) textNode.textContent = ' Convert Format';
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