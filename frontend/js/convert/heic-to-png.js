// PngToWebp Converter Tool
(function() {
  'use strict';

  let currentFile = null;
  let currentImage = null;
  let isImageLoaded = false;
  let originalCanvas = null;

  function initHeicToPngView() {
    console.log('Initializing PngToWebp view');

    // Add class to indicate single conversion page
    document.body.classList.add('single-conversion-page');

    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const dropZone = document.getElementById('dropZone');
    const editorView = document.getElementById('editorView');
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = document.getElementById('cropCanvas');
    const editorProcessingOverlay = document.getElementById('processingOverlay');
    const successView = document.getElementById('successView');
    const convertedImage = document.getElementById('convertedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertAnotherBtn = document.getElementById('convertAnotherBtn');

    // Create convert button below the image for single conversion pages
    if (canvasContainer) {
      // Create a new button below the image
      const newConvertBtn = document.createElement('button');
      newConvertBtn.id = 'convertBtnBelow';
      newConvertBtn.className = 'convert-action-btn';
      newConvertBtn.type = 'button';
      newConvertBtn.style.marginTop = '20px';
      newConvertBtn.style.width = '200px';
      newConvertBtn.style.marginLeft = 'auto';
      newConvertBtn.style.marginRight = 'auto';
      newConvertBtn.style.display = 'block';
      newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔄</span> Convert to PNG';

      // Add the new button below the canvas
      canvasContainer.parentNode.insertBefore(newConvertBtn, canvasContainer.nextSibling);

      // Add event listener to the new button
      newConvertBtn.addEventListener('click', async () => {
        if (!isImageLoaded || !currentFile) {
          alert('Please select an image first');
          return;
        }

        // Show processing state on button
        newConvertBtn.disabled = true;
        newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">⏳</span> Converting...';

        try {
          // Show processing overlay
          canvasContainer.style.display = 'none';
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'block';
          document.body.classList.add('has-processing-overlay');

          // Convert image directly using API
          const API_BASE = 'https://api.imagenerd.in';
          const requestData = {
            image_base64: currentImage,
            format: 'png'
          };

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

          // Convert base64 to blob
          const convertedBlob = base64ToBlob(result.converted_image_base64, 'png');
          const downloadUrl = URL.createObjectURL(convertedBlob);

          // Show success view
          if (convertedImage) convertedImage.src = downloadUrl;
          if (downloadBtn) {
            downloadBtn.href = downloadUrl;
            downloadBtn.download = `${(currentFile.name || 'image').replace(/\.[^.]+$/, '')}_converted.png`;
          }

          const fileSize = formatFileSize(convertedBlob.size);
          const dimensionsText = originalCanvas ? `${originalCanvas.width} × ${originalCanvas.height} pixels` : 'Converted';

          const successDimensions = document.getElementById('successDimensions');
          if (successDimensions) {
            successDimensions.textContent = `Converted to PNG • ${dimensionsText} • ${fileSize}`;
          }

          // Show success view
          if (successView) successView.style.display = 'flex';

          // Hide processing overlay
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
          document.body.classList.remove('has-processing-overlay');

        } catch (error) {
          console.error('Conversion error:', error);
          alert('Conversion failed: ' + error.message);

          // Reset processing state
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
          document.body.classList.remove('has-processing-overlay');
          canvasContainer.style.display = 'block';
        } finally {
          // Reset button state
          newConvertBtn.disabled = false;
          newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔄</span> Convert to PNG';
        }
      });
    }


    // File selection - create temporary input to avoid click() issues with hidden elements
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Create a new file input element to avoid click() issues with hidden elements
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.accept = '.heic,.heif,image/heic,image/heif';
      tempInput.style.display = 'none';
      tempInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
        document.body.removeChild(tempInput);
      });
      document.body.appendChild(tempInput);
      tempInput.click();
    });

    convertAnotherBtn.addEventListener('click', resetToUploader);

    // Click on drop zone to open file dialog (excluding select button)
    dropZone.addEventListener('click', (e) => {
      // Only trigger if not clicking on the select button or its children
      if (!e.target.closest('#selectBtn')) {
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = '.heic,.heif,image/heic,image/heif';
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
        alert('Unsupported format. Please upload HEIC.');
        return;
      }

      processFile(file);
    }

    async function processFile(file) {
      currentFile = file;

      try {
        let convertedFile;

        // Show processing overlay while converting HEIC
        if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'block';
        document.body.classList.add('has-processing-overlay');

        // Try to use browser native HEIC support first (for Safari/Chrome with HEIC support)
        try {
          console.log('Attempting to load HEIC file directly...');
          const objectUrl = URL.createObjectURL(file);
          const img = new Image();

          await new Promise((resolve, reject) => {
            img.onload = () => {
              console.log('HEIC loaded directly by browser');
              URL.revokeObjectURL(objectUrl);
              resolve();
            };
            img.onerror = reject;
            img.src = objectUrl;
          });

          // If we get here, browser supports HEIC natively
          convertedFile = file;
        } catch (nativeError) {
          console.log('Browser native HEIC support failed, using heic2any library...');

          // Check if heic2any is available
          if (typeof heic2any === 'undefined') {
            throw new Error('HEIC processing library not loaded. Please refresh the page and try again.');
          }

          // Convert HEIC to a displayable format using heic2any
          console.log('Converting HEIC file with heic2any...');
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/png',
            quality: 0.8
          });

          if (!convertedBlob) {
            throw new Error('HEIC conversion returned empty result');
          }

          convertedFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' });
          console.log('HEIC conversion successful, size:', convertedBlob.size);
        }

        currentImage = await fileToBase64(convertedFile);

        // Use the converted file for display (either original HEIC if browser supports it, or converted PNG)
        const displayFile = convertedFile;
        const objectUrl = URL.createObjectURL(displayFile);

        // Handle image load - set this BEFORE setting src
        canvas.onload = () => {
          isImageLoaded = true;
          originalCanvas = canvas;

          URL.revokeObjectURL(objectUrl);
        };

        // Set the image source
        canvas.src = objectUrl;

        // Show editor view
        dropZone.style.display = 'none';
        editorView.style.display = 'block';
        canvasContainer.style.display = 'block';
        if (successView) successView.style.display = 'none';
        if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';

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
          }
        }, 5000);

        canvas.onerror = () => {
          console.error('Canvas failed to load image');
          URL.revokeObjectURL(objectUrl);
          isImageLoaded = false;
          alert('Unable to load that image. Please try another file.');
        };

      } catch (error) {
        console.error('HEIC conversion error:', error);

        // Hide processing overlay on error
        if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
        document.body.classList.remove('has-processing-overlay');

        let errorMessage = 'Failed to process HEIC file.';
        if (error.message.includes('not loaded')) {
          errorMessage += ' The HEIC processing library failed to load. Please refresh the page.';
        } else if (error.message.includes('empty result')) {
          errorMessage += ' The file may be corrupted or not a valid HEIC image.';
        } else {
          errorMessage += ' Please try a different image or ensure it\'s a valid HEIC file.';
        }

        alert(errorMessage);
      }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
      const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
      reader.readAsDataURL(file);
      });
    }

    function resetToUploader() {
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      canvasContainer.style.display = 'block';
      if (successView) successView.style.display = 'none';
      if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
      document.body.classList.remove('has-processing-overlay');

      fileInput.value = '';
      currentFile = null;
      currentImage = null;
      isImageLoaded = false;
      originalCanvas = null;

      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function base64ToBlob(base64String, format) {
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
