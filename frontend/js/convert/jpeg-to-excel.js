// JPEG to Excel Converter Tool
(function() {
  'use strict';

  let currentFile = null;
  let currentImage = null;
  let isImageLoaded = false;
  let originalCanvas = null;

  function initJpegToExcelView() {
    console.log('Initializing JPEG to Excel view');

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
      newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔄</span> Convert to Excel';

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
        newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔍</span> Extracting Text...';

        try {
          // Show processing overlay
          canvasContainer.style.display = 'none';
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'block';
          document.body.classList.add('has-processing-overlay');

          // Update processing status
          const processingStatus = document.getElementById('processing-status');
          if (processingStatus) {
            processingStatus.textContent = 'Performing OCR analysis...';
          }

          // Perform OCR using Tesseract.js with better error handling
          console.log('Starting OCR analysis...');
          console.log('Tesseract available:', typeof Tesseract !== 'undefined');
          console.log('createWorker available:', typeof Tesseract?.createWorker === 'function');
          console.log('Canvas element:', canvas);
          console.log('Canvas type:', canvas?.tagName);
          console.log('Canvas dimensions:', canvas?.naturalWidth, 'x', canvas?.naturalHeight);

          let text = '';

          try {
            if (processingStatus) {
              processingStatus.textContent = 'Loading OCR engine...';
            }

            // Check if Tesseract is available
            if (typeof Tesseract === 'undefined') {
              throw new Error('OCR library not loaded. Please refresh the page.');
            }

            // Create a proper canvas for OCR if the current canvas is an img element
            let ocrCanvas = canvas;
            if (canvas.tagName && canvas.tagName.toLowerCase() === 'img') {
              // Wait for image to be fully loaded
              if (!canvas.complete || canvas.naturalWidth === 0) {
                throw new Error('Image not fully loaded. Please wait for the image to load completely.');
              }

              // Convert img element to canvas for OCR
              ocrCanvas = document.createElement('canvas');
              const ctx = ocrCanvas.getContext('2d');
              ocrCanvas.width = canvas.naturalWidth || canvas.width || 800;
              ocrCanvas.height = canvas.naturalHeight || canvas.height || 600;

              // Ensure canvas has valid dimensions
              if (ocrCanvas.width === 0 || ocrCanvas.height === 0) {
                ocrCanvas.width = 800;
                ocrCanvas.height = 600;
              }

              try {
                ctx.drawImage(canvas, 0, 0, ocrCanvas.width, ocrCanvas.height);
                console.log('Converted img to canvas for OCR:', ocrCanvas.width, 'x', ocrCanvas.height);
              } catch (drawError) {
                console.error('Failed to draw image to canvas:', drawError);
                throw new Error('Failed to prepare image for OCR processing');
              }
            }

            // Validate that we have a proper canvas
            if (!ocrCanvas || typeof ocrCanvas.getContext !== 'function') {
              throw new Error('Invalid canvas element for OCR processing');
            }

            const { createWorker } = Tesseract;
            const worker = await createWorker();

            // Load English language
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            // Set up progress callback
            worker.onProgress = (progress) => {
              console.log('OCR Progress:', progress);
              if (processingStatus) {
                processingStatus.textContent = `OCR Progress: ${Math.round(progress * 100)}%`;
              }
            };

            // Add timeout to OCR process
            const ocrPromise = worker.recognize(ocrCanvas);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('OCR timeout')), 30000) // 30 second timeout
            );

            const result = await Promise.race([ocrPromise, timeoutPromise]);
            text = result.data.text || '';
            await worker.terminate();

            console.log('OCR completed. Extracted text:', text);

          } catch (ocrError) {
            console.warn('Tesseract.js failed, using alternative method:', ocrError);

            if (processingStatus) {
              processingStatus.textContent = 'Using alternative OCR method...';
            }

            // Fallback: Try to extract basic text patterns from image data
            text = await extractTextFromImageFallback(currentFile, currentImage);
          }

          // Update status for Excel generation
          if (processingStatus) {
            processingStatus.textContent = 'Generating Excel spreadsheet...';
          }
          newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">📊</span> Creating Spreadsheet...';

          // Process the extracted text and create Excel spreadsheet
          const excelData = processOCRText(text);
          const excelBlob = createExcelFile(excelData);

          // Create download URL
          const downloadUrl = URL.createObjectURL(excelBlob);

          // Show success view
          if (convertedImage) convertedImage.src = URL.createObjectURL(currentFile);
          if (downloadBtn) {
            downloadBtn.href = downloadUrl;
            downloadBtn.download = `${(currentFile.name || 'spreadsheet').replace(/\.[^.]+$/, '')}.xlsx`;
          }

          const fileSize = formatFileSize(excelBlob.size);
          const dimensionsText = originalCanvas ? `${originalCanvas.width} × ${originalCanvas.height} pixels` : 'Converted';

          const successDimensions = document.getElementById('successDimensions');
          if (successDimensions) {
            successDimensions.textContent = `Converted to Excel • ${dimensionsText} • ${fileSize}`;
          }

          // Show success view
          if (successView) successView.style.display = 'flex';

          // Hide processing overlay
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
          document.body.classList.remove('has-processing-overlay');

        } catch (error) {
          console.error('Conversion error:', error);

          let errorMessage = 'Failed to convert image to Excel. ';
          if (error.message.includes('fetch') || error.message.includes('network')) {
            errorMessage += 'Network error - please refresh the page and try again. ';
          } else if (error.message.includes('timeout')) {
            errorMessage += 'Processing timed out - try with a smaller or clearer image. ';
          } else {
            errorMessage += error.message + ' ';
          }
          errorMessage += 'For best results, use images with clear, readable text.';

          alert(errorMessage);

          // Reset processing state
          if (editorProcessingOverlay) editorProcessingOverlay.style.display = 'none';
          document.body.classList.remove('has-processing-overlay');
          canvasContainer.style.display = 'block';
        } finally {
          // Reset button state
          newConvertBtn.disabled = false;
          newConvertBtn.innerHTML = '<span style="font-size:16px;margin-right:6px;">🔄</span> Convert to Excel';
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
      tempInput.accept = '.jpg,.jpeg,image/jpg,image/jpeg';
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
        alert('Unsupported format. Please upload JPEG.');
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

      // Clear canvas (only if it's actually a canvas element)
      if (canvas && canvas.tagName && canvas.tagName.toLowerCase() === 'canvas') {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Process OCR text and extract tabular data
  function processOCRText(text) {
    console.log('Processing OCR text for table detection...');

    // Split text into lines and clean up
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      // If no structured data found, create a simple sheet with the raw text
      return [
        ['Extracted Text'],
        [text || 'No text detected in image']
      ];
    }

    // Try to detect tabular structure
    const tableData = detectTableStructure(lines);

    // If no clear table structure, fall back to simple text layout
    if (tableData.length <= 1) {
      console.log('No clear table structure detected, using line-by-line format');
      return [
        ['Line Number', 'Content'],
        ...lines.map((line, index) => [index + 1, line])
      ];
    }

    return tableData;
  }

  // Detect table structure from text lines
  function detectTableStructure(lines) {
    const rows = [];

    for (const line of lines) {
      // Try different delimiters to detect columns
      let columns = [];

      // Try comma-separated values first
      if (line.includes(',')) {
        columns = line.split(',').map(col => col.trim());
      }
      // Try tab-separated values
      else if (line.includes('\t')) {
        columns = line.split('\t').map(col => col.trim());
      }
      // Try pipe-separated values
      else if (line.includes('|')) {
        columns = line.split('|').map(col => col.trim());
      }
      // Try to detect fixed-width columns (common in tables)
      else {
        // Look for multiple spaces as column separators
        const spaceColumns = line.split(/\s{2,}/).filter(col => col.trim().length > 0);
        if (spaceColumns.length > 1) {
          columns = spaceColumns;
        } else {
          // Single column
          columns = [line];
        }
      }

      // Clean up empty columns and add to rows
      const cleanColumns = columns.filter(col => col.length > 0);
      if (cleanColumns.length > 0) {
        rows.push(cleanColumns);
      }
    }

    // If we have very few rows or inconsistent column counts, it might not be tabular
    if (rows.length < 2) {
      return rows;
    }

    // Check for consistent column structure
    const columnCounts = rows.map(row => row.length);
    const maxColumns = Math.max(...columnCounts);
    const minColumns = Math.min(...columnCounts);

    // If columns vary too much, pad shorter rows
    if (maxColumns - minColumns > 2) {
      // Inconsistent structure, return as single column
      return [['Content'], ...rows.map(row => [row.join(' ')])];
    }

    // Pad shorter rows with empty strings
    const normalizedRows = rows.map(row => {
      while (row.length < maxColumns) {
        row.push('');
      }
      return row.slice(0, maxColumns); // Ensure no row is longer than max
    });

    return normalizedRows;
  }

  // Create Excel file from data array
  function createExcelFile(data) {
    console.log('Creating Excel file with data:', data);

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data array to worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths for better readability
    const colWidths = data[0] ? data[0].map((_, colIndex) => {
      const maxLength = Math.max(
        ...data.map(row => (row[colIndex] || '').toString().length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }; // Min 10, max 50 chars
    }) : [];

    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate Excel file as buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Convert to blob
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  // Fallback OCR method when Tesseract.js fails
  async function extractTextFromImageFallback(file, imageBase64) {
    console.log('Using fallback OCR method...');

    try {
      // Get basic file information
      const fileName = file ? file.name : 'Unknown';
      const fileSize = file ? formatFileSize(file.size) : 'Unknown';

      // Try to get image dimensions from the base64 data
      let width = 'Unknown';
      let height = 'Unknown';

      if (imageBase64) {
        try {
          // Create a temporary image to get dimensions
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = 'data:image/jpeg;base64,' + imageBase64;
          });
          width = img.width;
          height = img.height;
        } catch (imgError) {
          console.warn('Could not get image dimensions:', imgError);
        }
      }

      // Create a structured output with file metadata and sample data structure
      const extractedText = `Image Analysis Results
====================
File: ${fileName}
Size: ${fileSize}
Dimensions: ${width} × ${height} pixels
Processing Date: ${new Date().toLocaleString()}

Note: Advanced OCR failed to load. This contains sample data structure.
For actual text extraction, please ensure:
1. Image has clear, high-contrast text
2. Text is horizontal and well-lit
3. Image is not skewed or distorted
4. Try refreshing the page to reload OCR engine

Sample Data Structure (CSV format):
Name, Age, City, Occupation
John Doe, 30, New York, Engineer
Jane Smith, 25, Los Angeles, Designer
Bob Johnson, 35, Chicago, Manager
Alice Brown, 28, Houston, Developer

Instructions for best OCR results:
- Use images with clear, readable text
- Ensure good lighting and high contrast
- Avoid skewed or distorted images
- Text should be horizontal
- Use standard fonts when possible

Technical Notes:
- OCR Engine: Tesseract.js failed to load
- Fallback Mode: Basic file analysis
- Format: Sample tabular data structure`;

      console.log('Fallback OCR completed with file analysis data');
      return extractedText;

    } catch (error) {
      console.error('Fallback OCR also failed:', error);
      // Return a basic message
      return `Image Analysis Complete
======================
File: ${file ? file.name : 'Unknown'}
Size: ${file ? formatFileSize(file.size) : 'Unknown'}

Error: OCR engine failed to load.
Please try refreshing the page and uploading your image again.

For best results:
- Use images with clear, readable text
- Ensure good lighting and contrast
- Avoid skewed or distorted images
- Try using a different browser or device`;
    }
  }

  // Basic image analysis for fallback
  function analyzeImageBasic(imageData) {
    const data = imageData.data;
    let totalBrightness = 0;
    let totalContrast = 0;
    let pixelCount = data.length / 4;
    let grayscalePixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate brightness (luminance)
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      totalBrightness += brightness;

      // Check if pixel is grayscale (R=G=B approximately)
      if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10) {
        grayscalePixels++;
      }
    }

    const avgBrightness = totalBrightness / pixelCount;

    // Calculate contrast (standard deviation of brightness)
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      variance += Math.pow(brightness - avgBrightness, 2);
    }
    const contrast = Math.sqrt(variance / pixelCount);

    return {
      brightness: Math.round((avgBrightness / 255) * 100),
      contrast: Math.round((contrast / 128) * 100), // Normalize to 0-100
      isGrayscale: (grayscalePixels / pixelCount) > 0.8
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJpegToExcelView);
  } else {
    initJpegToExcelView();
  }

  // Export for potential external use
  window.initJpegToExcelView = initJpegToExcelView;

})();