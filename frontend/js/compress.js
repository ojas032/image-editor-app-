/**
 * Compress page JavaScript functionality
 * Handles image compression operations
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

  // Compress page initialization
  function initCompressPage() {
    console.log('Compress page initialized');

    // Get DOM elements
    const section = document.getElementById('compressSection');
    if (!section) {
      console.error('Compress section not found');
      return;
    }

    // Create compress UI
    section.innerHTML = `
      <div class="compress-card" role="region" aria-live="polite">
        <div class="compress-uploader" id="compress-dropZone">
          <input id="compress-fileInput" type="file" accept="image/*" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px" aria-hidden="true" />
          <button class="btn btn-primary" id="compress-selectBtn" type="button">Select image</button>
          <div class="compress-help">or drop image here</div>
        </div>
        <div id="compress-editorView" style="display:none;max-width:700px;margin:0 auto;text-align:center;">
          <div id="compress-processingOverlay" style="display:flex;flex-direction:column;align-items:center;padding:40px;">
            <div style="display:inline-block;width:48px;height:48px;border:4px solid var(--primary-500);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:16px"></div>
            <div style="font-weight:600;font-size:18px;color:var(--light-text);">Compressing your image...</div>
          </div>
          <div id="compress-successView" style="display:none;">
            <div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#fff;border-radius:12px;padding:32px;margin-bottom:24px;">
              <div style="font-size:20px;font-weight:600;margin-bottom:8px;">✓ Saved</div>
              <div style="font-size:32px;font-weight:700;margin-bottom:16px;">Your image is now <span id="compress-reductionPercent">82</span>% smaller!</div>
              <div style="font-size:18px;opacity:0.9;">
                <span id="compress-originalSizeDisplay">818.94 KB</span> → <span id="compress-compressedSizeDisplay">148.47 KB</span>
              </div>
            </div>
            <div style="margin-bottom:24px;">
              <img id="compress-compressedImg" src="" alt="Compressed" style="max-width:100%;max-height:400px;border:1px solid var(--light-border);border-radius:8px;" />
            </div>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a class="btn btn-primary" id="compress-downloadBtn" href="#" download style="font-size:16px;padding:12px 24px;">Download Image</a>
              <button class="btn btn-ghost" id="compress-changeImageBtn" type="button" style="font-size:16px;padding:12px 24px;">Compress Another</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize compress functionality
    setupCompressFunctionality();
  }

  function setupCompressFunctionality() {
    const fileInput = document.getElementById('compress-fileInput');
    const selectBtn = document.getElementById('compress-selectBtn');
    const dropZone = document.getElementById('compress-dropZone');
    const editorView = document.getElementById('compress-editorView');
    const processingOverlay = document.getElementById('compress-processingOverlay');
    const successView = document.getElementById('compress-successView');
    const compressedImg = document.getElementById('compress-compressedImg');
    const changeImageBtn = document.getElementById('compress-changeImageBtn');
    const downloadBtn = document.getElementById('compress-downloadBtn');
    const reductionPercent = document.getElementById('compress-reductionPercent');
    const originalSizeDisplay = document.getElementById('compress-originalSizeDisplay');
    const compressedSizeDisplay = document.getElementById('compress-compressedSizeDisplay');

    let currentFile = null;
    let currentBase64 = '';
    let originalFileSize = 0;

    selectBtn.addEventListener('click', () => fileInput.click());
    changeImageBtn.addEventListener('click', () => {
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      successView.style.display = 'none';
      fileInput.value = '';
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function handleFiles(list) {
      const files = Array.from(list || []).filter(f => /^image\//.test(f.type));
      if (!files.length) return;
      processFile(files[0]);
    }

    async function processFile(file) {
      currentFile = file;
      originalFileSize = file.size;
      currentBase64 = await fileToBase64(file);
      dropZone.style.display = 'none';
      editorView.style.display = 'block';
      processingOverlay.style.display = 'flex';
      successView.style.display = 'none';
      compressImage();
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    async function compressImage() {
      if (!currentBase64) return;
      try {
        const isPNG = currentFile.type.includes('png');
        const body = { image_base64: currentBase64, quality: 88 };
        if (isPNG) body.format = 'jpeg';

        const res = await fetchWithTimeout(API_BASE + '/compress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!data.compressed_image_base64) throw new Error(data.error || 'Compression failed');

        const compressedSize = Math.round((data.compressed_image_base64.length * 3) / 4);
        const reduction = ((originalFileSize - compressedSize) / originalFileSize * 100).toFixed(0);

        if (compressedSize >= originalFileSize) {
          throw new Error('Unable to reduce file size. The image may already be optimized.');
        }

        const outputFormat = body.format || (isPNG ? 'png' : 'jpeg');
        const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const fileExt = outputFormat === 'jpeg' ? 'jpg' : 'png';
        const downloadUrl = `data:${mimeType};base64,${data.compressed_image_base64}`;
        compressedImg.src = downloadUrl;
        reductionPercent.textContent = reduction;
        originalSizeDisplay.textContent = formatFileSize(originalFileSize);
        compressedSizeDisplay.textContent = formatFileSize(compressedSize);
        downloadBtn.href = downloadUrl;
        downloadBtn.download = (currentFile.name || 'image').replace(/\.[^.]+$/, '') + '-compressed.' + fileExt;
        processingOverlay.style.display = 'none';
        successView.style.display = 'block';
      } catch (err) {
        console.error(err);
        processingOverlay.style.display = 'none';
        alert('Failed to compress image: ' + err.message);
        dropZone.style.display = 'block';
        editorView.style.display = 'none';
      }
    }
  }

  // Export for use in other modules
  window.initCompressPage = initCompressPage;

})();
