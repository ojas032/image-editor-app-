// JPG to PDF Converter Tool
(function() {
  'use strict';

  let currentFile = null;
  let currentImage = null;
  let isImageLoaded = false;
  let originalCanvas = null;
  let jspdfLoaded = false;

  // DOM elements (will be set in initJpgToPdfView)
  let canvas = null;

    async function processFile(file) {
    currentFile = file;
    currentImage = await fileToBase64(file);

    const objectUrl = URL.createObjectURL(file);

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

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
    reader.readAsDataURL(file);
    });
  }

  function initJpgToPdfView() {
    // Add class to indicate single conversion page
    document.body.classList.add('single-conversion-page');

    // Load jsPDF library dynamically
    loadJSPDF();

    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const dropZone = document.getElementById('dropZone');
    const editorView = document.getElementById('editorView');
    const canvasContainer = document.getElementById('canvasContainer');
    canvas = document.getElementById('cropCanvas');

    // Attach change event listener to the existing file input
    if (fileInput) {
      fileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
      });
    }

    const editorProcessingOverlay = document.getElementById('processingOverlay');
    const successView = document.getElementById('successView');
    const convertedImage = document.getElementById('convertedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const convertAnotherBtn = document.getElementById('convertAnotherBtn');

    // File selection - create temporary input to avoid click() issues with hidden elements
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
      newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔄</span> Convert to PDF';

      // Add the new button below the canvas
      canvasContainer.parentNode.insertBefore(newConvertBtn, canvasContainer.nextSibling);

      // Add event listener to the new button
      newConvertBtn.addEventListener('click', async () => {
        if (!isImageLoaded || !currentFile) {
          alert('Please select an image first');
          return;
        }

        if (!jspdfLoaded) {
          alert('PDF library is loading. Please try again in a moment.');
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

          // Convert image to PDF using jsPDF
          const pdfBlob = await convertImageToPDF(currentFile);

          // Create download URL
          const downloadUrl = URL.createObjectURL(pdfBlob);

          // Show success view
          if (convertedImage) convertedImage.src = URL.createObjectURL(currentFile); // Show original image
          if (downloadBtn) {
            downloadBtn.href = downloadUrl;
            downloadBtn.download = `${(currentFile.name || 'document').replace(/\.[^.]+$/, '')}.pdf`;
          }

          const fileSize = formatFileSize(pdfBlob.size);
          const dimensionsText = originalCanvas ? `${originalCanvas.width} × ${originalCanvas.height} pixels` : 'Converted';

          const successDimensions = document.getElementById('successDimensions');
          if (successDimensions) {
            successDimensions.textContent = `Converted to PDF • ${dimensionsText} • ${fileSize}`;
          }

          // Show success view
          if (successView) successView.style.display = 'flex';

          // Hide processing overlay
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
          document.body.classList.remove('has-processing-overlay');

        } catch (error) {
          console.error('PDF conversion error:', error);
          alert('Failed to convert image to PDF: ' + error.message);

          // Reset processing state
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
          document.body.classList.remove('has-processing-overlay');
          canvasContainer.style.display = 'block';
        } finally {
          // Reset button state
          newConvertBtn.disabled = false;
          newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔄</span> Convert to PDF';
        }
      });
    }

    // File selection - create temporary input to avoid click() issues with hidden elements
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Use the existing file input and trigger click on it
      if (fileInput) {
        fileInput.click();
      } else {
        // Create a new file input element to avoid click() issues with hidden elements
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.accept = '.jpg,.jpeg,image/jpg,image/jpeg';
        tempInput.style.display = 'none';
        tempInput.addEventListener('change', (event) => {
          handleFiles(event.target.files);
          document.body.removeChild(tempInput);
        });
        document.body.appendChild(tempInput);
        tempInput.click();
      }
    });

    convertAnotherBtn.addEventListener('click', resetToUploader);

    // Note: Drop zone click handling removed to avoid conflicts with select button
    // Users should use the select button to choose files, drop zone is for drag & drop only

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
      const validFormats = ['image/jpeg', 'image/jpg'];
      if (!validFormats.includes(file.type)) {
        alert('Unsupported format. Please upload JPG.');
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
    }

  }

  // Load jsPDF library dynamically
  function loadJSPDF() {
    if (window.jspdf || jspdfLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      jspdfLoaded = true;
    };
    script.onerror = () => {
      console.error('Failed to load jsPDF');
      alert('PDF conversion library failed to load. Please refresh the page.');
    };
    document.head.appendChild(script);
  }

  // Convert image to PDF using jsPDF
  async function convertImageToPDF(file) {
    return new Promise((resolve, reject) => {
      if (!window.jspdf) {
        reject(new Error('jsPDF library not loaded'));
        return;
      }

      const { jsPDF } = window.jspdf;
      const img = new Image();

      img.onload = function() {
        try {
          // Calculate dimensions to fit on A4 page
          const pdf = new jsPDF({
            orientation: img.width > img.height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          // Calculate scaling to fit image on page
          const imgAspectRatio = img.width / img.height;
          const pdfAspectRatio = pdfWidth / pdfHeight;

          let imgWidth, imgHeight;
          if (imgAspectRatio > pdfAspectRatio) {
            // Image is wider than PDF page
            imgWidth = pdfWidth;
            imgHeight = pdfWidth / imgAspectRatio;
          } else {
            // Image is taller than PDF page
            imgHeight = pdfHeight;
            imgWidth = pdfHeight * imgAspectRatio;
          }

          // Center the image on the page
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;

          // Add image to PDF
          pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);

          // Generate PDF blob
          const pdfBlob = pdf.output('blob');
          resolve(pdfBlob);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
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
    document.addEventListener('DOMContentLoaded', initJpgToPdfView);
  } else {
    initJpgToPdfView();
  }

  // Export for potential external use
  window.initJpgToPdfView = initJpgToPdfView;
  window.selectJpegImage = function() {
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = '.jpg,.jpeg,image/jpg,image/jpeg';
    tempInput.style.display = 'none';
    tempInput.addEventListener('change', (event) => {
      handleFiles(event.target.files);
      document.body.removeChild(tempInput);
    });
    document.body.appendChild(tempInput);
    tempInput.click();
  };

})();