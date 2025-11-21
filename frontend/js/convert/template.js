// PNG to JPEG Converter Tool
(function() {
  'use strict';

  let currentFile = null;
  let currentImage = null;
  let isImageLoaded = false;
  let selectedFormat = null;

  function initPngToJpegView() {
    console.log('Initializing PNG to JPEG view');

    // Add class to indicate single conversion page
    document.body.classList.add('single-conversion-page');

    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const dropZone = document.getElementById('dropZone');
    const editorView = document.getElementById('editorView');
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = document.getElementById('cropCanvas');
    const imageDimensions = document.getElementById('imageDimensions');
    const editorProcessingOverlay = document.getElementById('processingOverlay');
    const successView = document.getElementById('successView');
    const convertedImage = document.getElementById('convertedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertAnotherBtn = document.getElementById('convertAnotherBtn');
    const convertBtn = document.getElementById('convertBtn');

    // Hide format selection since this page only converts to JPEG
    const formatCard = document.querySelector('.control-card h4');
    if (formatCard && formatCard.textContent.includes('Output Format')) {
      formatCard.closest('.control-card').style.display = 'none';
    }


    // File selection
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Create a new file input element to avoid click() issues with hidden elements
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.accept = '.png,image/png';
      tempInput.style.display = 'none';
      tempInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
        document.body.removeChild(tempInput);
      });
      document.body.appendChild(tempInput);
      tempInput.click();
    });

    convertAnotherBtn.addEventListener('click', resetToUploader);

    // Click on drop zone (excluding select button) to open file dialog
    dropZone.addEventListener('click', (e) => {
      // Only trigger if not clicking on the select button or its children
      if (!e.target.closest('#selectBtn')) {
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = '.png,image/png';
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

    // Convert button
    convertBtn.addEventListener('click', handleConvert);

    function handleFiles(list) {
      const files = Array.from(list || []).filter(f => /^image\/png/.test(f.type) || f.name.toLowerCase().endsWith('.png'));
      if (!files.length) {
        alert('Please select a valid PNG image file.');
        return;
      }

      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10 MB limit. Please choose a smaller file.');
        return;
      }

      processFile(file);
    }

    async function processFile(file) {
      currentFile = file;
      currentImage = await fileToBase64(file);

      const objectUrl = URL.createObjectURL(file);

      // Handle image load - set this BEFORE setting src
      canvas.onload = () => {
        isImageLoaded = true;

        // Update dimensions display
        const naturalWidth = canvas.naturalWidth;
        const naturalHeight = canvas.naturalHeight;
        imageDimensions.textContent = `Original: ${naturalWidth} × ${naturalHeight} pixels`;

        // Enable convert button now that image is loaded
        convertBtn.disabled = false;
        const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.textContent = ' Convert to JPEG';

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
          if (textNode) textNode.textContent = ' Convert to JPEG';
        }
      }, 5000);

      canvas.onerror = () => {
        console.error('Canvas failed to load image');
        URL.revokeObjectURL(objectUrl);
        convertBtn.disabled = false;
        const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.textContent = ' Convert to JPEG';
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

    async function handleConvert() {
      if (!isImageLoaded || !currentFile) {
        alert('Please select an image first');
        return;
      }

      // Show processing overlay
      canvasContainer.style.display = 'none';
      imageDimensions.style.display = 'none';
      document.querySelectorAll('.control-card').forEach(card => card.style.display = 'none');
      editorProcessingOverlay.style.display = 'block';
      document.body.classList.add('has-processing-overlay');
      successView.style.display = 'none';

      try {
        // Prepare the request data
        const requestData = {
          image_base64: currentImage,
          format: 'jpg'
        };

        // Call the backend API
        const response = await fetch('https://api.imagenerd.in/convert', {
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
        const convertedBlob = base64ToBlob(result.converted_image_base64, 'jpg');

        if (!convertedBlob || !convertedBlob.type) {
          throw new Error('Failed to create blob from server response');
        }

        // Create download URL
        const downloadUrl = URL.createObjectURL(convertedBlob);

        // Update success view
        convertedImage.src = downloadUrl;

        const fileSize = formatFileSize(convertedBlob.size);
        const actualFormat = convertedBlob.type.split('/')[1].toUpperCase();

        document.getElementById('successDimensions').textContent =
          `Converted to ${actualFormat} • ${canvas.naturalWidth} × ${canvas.naturalHeight} pixels • ${fileSize}`;

        // Setup download
        const baseName = (currentFile.name || 'image').replace(/\.[^.]+$/, '');
        downloadBtn.href = downloadUrl;
        downloadBtn.download = `${baseName}_converted.jpg`;

        // Show success view
        editorProcessingOverlay.style.display = 'none';
        document.body.classList.remove('has-processing-overlay');
        successView.style.display = 'flex';

      } catch (error) {
        console.error('Conversion error:', error);
        alert('Failed to convert image: ' + error.message);
        // Reset view
        editorProcessingOverlay.style.display = 'none';
        document.body.classList.remove('has-processing-overlay');
        canvasContainer.style.display = 'block';
        document.querySelectorAll('.control-card').forEach(card => card.style.display = 'block');
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

    function resetToUploader() {
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      canvasContainer.style.display = 'block';
      successView.style.display = 'none';
      editorProcessingOverlay.style.display = 'none';
      imageDimensions.style.display = 'block';
      document.querySelectorAll('.control-card').forEach(card => card.style.display = 'block');

      fileInput.value = '';
      currentFile = null;
      currentImage = null;
      isImageLoaded = false;

      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Reset button state
      convertBtn.disabled = false;
      const textNode = Array.from(convertBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (textNode) textNode.textContent = ' Convert to JPEG';
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPngToJpegView);
  } else {
    initPngToJpegView();
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

  // Export for potential external use
  window.initPngToJpegView = initPngToJpegView;

})();
