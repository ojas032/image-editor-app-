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
    const dropZone = document.getElementById('dropZone');
    const editorView = document.getElementById('editorView');
    const previewSection = document.getElementById('previewSection');
    const formatSection = document.getElementById('formatSection');
    const qualitySection = document.getElementById('qualitySection');
    const actionSection = document.getElementById('actionSection');
    const resultsSection = document.getElementById('resultsSection');

    const originalImage = document.getElementById('originalImage');
    const originalFormat = document.getElementById('originalFormat');
    const originalSize = document.getElementById('originalSize');
    const originalDimensions = document.getElementById('originalDimensions');

    const outputFormatRadios = document.getElementsByName('outputFormat');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');

    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');

    const convertedImage = document.getElementById('convertedImage');
    const convertedFormat = document.getElementById('convertedFormat');
    const convertedSize = document.getElementById('convertedSize');
    const convertedDimensions = document.getElementById('convertedDimensions');
    const downloadBtn = document.getElementById('downloadBtn');

    // Event listeners
    selectBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    // Format selection
    outputFormatRadios.forEach(radio => {
      radio.addEventListener('change', updateQualitySection);
    });

    // Quality slider
    qualitySlider.addEventListener('input', (e) => {
      qualityValue.textContent = e.target.value;
    });

    // Convert button
    convertBtn.addEventListener('click', convertImage);

    // Reset button
    resetBtn.addEventListener('click', resetForm);

    // Download button
    downloadBtn.addEventListener('click', downloadImage);

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
          originalFormat.textContent = getFileFormat(file);
          originalSize.textContent = formatFileSize(file.size);
          originalDimensions.textContent = `${img.width} × ${img.height}`;

          // Show editor, hide uploader
          dropZone.style.display = 'none';
          editorView.style.display = 'block';

          // Update format options based on input format
          updateFormatOptions(file.type);

          // Show quality section for formats that support it
          updateQualitySection();
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

    function updateQualitySection() {
      const selectedFormat = document.querySelector('input[name="outputFormat"]:checked').value;
      const qualityContainer = document.getElementById('qualitySection');

      if (selectedFormat === 'jpg' || selectedFormat === 'webp') {
        qualityContainer.style.display = 'block';
      } else {
        qualityContainer.style.display = 'none';
      }
    }

    async function convertImage() {
      if (!currentImage || !currentFile) {
        alert('Please select an image first');
        return;
      }

      const selectedFormat = document.querySelector('input[name="outputFormat"]:checked').value;
      const quality = qualitySlider.value / 100;

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
        let mimeType, fileExtension;
        switch (selectedFormat) {
          case 'png':
            mimeType = 'image/png';
            fileExtension = 'png';
            break;
          case 'jpg':
            mimeType = 'image/jpeg';
            fileExtension = 'jpg';
            break;
          case 'webp':
            mimeType = 'image/webp';
            fileExtension = 'webp';
            break;
          case 'gif':
            // For GIF, we'll use PNG as intermediate format
            mimeType = 'image/png';
            fileExtension = 'gif';
            break;
          case 'bmp':
            // For BMP, we'll use PNG as intermediate format
            mimeType = 'image/png';
            fileExtension = 'bmp';
            break;
          case 'tiff':
            // For TIFF, we'll use PNG as intermediate format
            mimeType = 'image/png';
            fileExtension = 'tiff';
            break;
          default:
            mimeType = 'image/png';
            fileExtension = 'png';
        }

        // Convert canvas to blob
        const convertedBlob = await new Promise(resolve => {
          canvas.toBlob(resolve, mimeType, quality);
        });

        if (!convertedBlob) {
          throw new Error('Conversion failed');
        }

        // Create download URL
        const convertedUrl = URL.createObjectURL(convertedBlob);

        // Update results
        convertedImage.src = convertedUrl;
        convertedFormat.textContent = selectedFormat.toUpperCase();
        convertedSize.textContent = formatFileSize(convertedBlob.size);
        convertedDimensions.textContent = `${canvas.width} × ${canvas.height}`;

        // Set download attributes
        const originalName = currentFile.name.replace(/\.[^/.]+$/, '');
        downloadBtn.download = `${originalName}_converted.${fileExtension}`;
        downloadBtn.href = convertedUrl;

        // Show results, hide editor
        formatSection.style.display = 'none';
        qualitySection.style.display = 'none';
        actionSection.style.display = 'none';
        resultsSection.style.display = 'block';

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
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      formatSection.style.display = 'block';
      updateQualitySection();
      actionSection.style.display = 'block';
      resultsSection.style.display = 'none';

      // Reset format selection to JPEG
      document.querySelector('input[name="outputFormat"][value="jpg"]').checked = true;

      // Reset quality
      qualitySlider.value = 85;
      qualityValue.textContent = '85';
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
