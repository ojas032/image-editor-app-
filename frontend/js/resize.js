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

    // Get DOM elements
    const section = document.getElementById('resizeSection');
    if (!section) {
      console.error('Resize section not found');
      return;
    }

    // Create resize UI
    section.innerHTML = `<div class="resize-card" role="region" aria-live="polite">
      <div class="resize-uploader" id="resize-dropZone">
        <input id="resize-fileInput" type="file" accept="image/*" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px" aria-hidden="true" />
        <button class="btn btn-primary" id="resize-selectBtn" type="button">Select image</button>
        <div class="resize-help">or drop image here</div>
        <div class="file-limit">Max file size: 10 MB</div>
      </div>
      <div id="resize-editorView" style="display:none;max-width:900px;margin:0 auto;">
        <div id="resize-previewSection" style="text-align:center;margin-bottom:32px;">
          <img id="resize-previewImg" src="" alt="Preview" style="max-width:100%;max-height:400px;border:1px solid var(--light-border);border-radius:8px;" />
          <div id="resize-imageDimensions" style="margin-top:12px;font-size:14px;color:var(--light-muted);"></div>
        </div>
        <div class="resize-settings">
          <h2 style="font-size:24px;font-weight:700;margin-bottom:24px;">Resize Settings</h2>
          <div style="margin-bottom:28px;">
            <label for="resize-resizeMethod" style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Resize Method</label>
            <select id="resize-resizeMethod" class="form-select" style="max-width:400px;">
              <option value="socialMedia">Social Media Preset</option>
              <option value="bySize">Custom Size</option>
              <option value="byPercent">By Percentage</option>
            </select>
          </div>
          <div id="resize-socialMediaOptions">
            <div style="margin-bottom:24px;">
              <label for="resize-platformSelect" style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Choose Platform</label>
              <select id="resize-platformSelect" class="form-select" style="max-width:400px;">
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter / X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="pinterest">Pinterest</option>
              </select>
            </div>
            <div id="resize-presetTypeContainer" style="margin-bottom:24px;display:none;">
              <label for="resize-presetTypeSelect" style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Preset Type</label>
              <select id="resize-presetTypeSelect" class="form-select" style="max-width:400px;"></select>
            </div>
          </div>
          <div id="resize-bySizeOptions" style="display:none;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
              <div><label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Width (px)</label>
              <input type="number" id="resize-widthInput" class="form-control" min="1" /></div>
              <div><label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Height (px)</label>
              <input type="number" id="resize-heightInput" class="form-control" min="1" /></div>
            </div>
          </div>
          <div id="resize-byPercentOptions" style="display:none;">
            <label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Resize Percentage (%)</label>
            <input type="number" id="resize-percentInput" class="form-control" value="100" min="1" max="500" style="max-width:300px;" />
          </div>
          <div id="resize-dimensionsDisplay" style="display:none;margin:24px 0;padding:20px;background:rgba(91,140,255,0.06);border:1px solid rgba(91,140,255,0.2);border-radius:10px;">
            <div style="margin-bottom:12px;font-weight:600;">✓ Final Dimensions</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
              <div><label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Width</label>
              <input type="number" id="resize-finalWidthDisplay" class="form-control" readonly /></div>
              <div><label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px;">Height</label>
              <input type="number" id="resize-finalHeightDisplay" class="form-control" readonly /></div>
            </div>
          </div>
          <div id="resize-aspectRatioControl" style="display:none;margin-bottom:24px;">
            <input class="form-check-input" type="checkbox" id="resize-lockAspectRatio" checked />
            <label class="form-check-label" for="resize-lockAspectRatio" style="font-weight:600;margin-left:8px;">Lock Aspect Ratio</label>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <button class="btn btn-primary" id="resize-exportBtn" type="button" style="font-size:18px;padding:14px 40px;">Export →</button>
          </div>
        </div>
        <div id="resize-processingOverlay" style="display:none;flex-direction:column;align-items:center;padding:40px;text-align:center;">
          <div style="display:inline-block;width:48px;height:48px;border:4px solid var(--primary-500);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:16px"></div>
          <div style="font-weight:600;font-size:18px;">Resizing...</div>
        </div>
        <div id="resize-successView" style="display:none;text-align:center;margin-top:32px;">
          <div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#fff;border-radius:12px;padding:32px;margin-bottom:24px;">
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">✓ Image Resized!</div>
            <div style="font-size:18px;" id="resize-successDimensions"></div>
          </div>
          <div style="margin-bottom:24px;">
            <img id="resize-resizedImg" src="" alt="Resized" style="max-width:100%;max-height:500px;border:1px solid var(--light-border);border-radius:8px;" />
          </div>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a class="btn btn-primary" id="resize-downloadBtn" href="#" download style="font-size:16px;padding:12px 24px;">Download</a>
            <button class="btn btn-ghost" id="resize-resizeAnotherBtn" type="button" style="font-size:16px;padding:12px 24px;">Resize Another</button>
          </div>
        </div>
      </div>
    </div>`;

    // Initialize resize functionality
    setupResizeFunctionality();
  }

  function setupResizeFunctionality() {
    const SOCIAL_PRESETS = {
      youtube: [{ name: 'Thumbnail (1280 × 720)', width: 1280, height: 720 }],
      instagram: [{ name: 'Post Square (1080 × 1080)', width: 1080, height: 1080 }],
      facebook: [{ name: 'Post (1200 × 630)', width: 1200, height: 630 }],
      twitter: [{ name: 'Post (1200 × 675)', width: 1200, height: 675 }],
      linkedin: [{ name: 'Post (1200 × 627)', width: 1200, height: 627 }],
      tiktok: [{ name: 'Video (1080 × 1920)', width: 1080, height: 1920 }],
      pinterest: [{ name: 'Pin (1000 × 1500)', width: 1000, height: 1500 }]
    };

    const fileInput = document.getElementById('resize-fileInput');
    const selectBtn = document.getElementById('resize-selectBtn');
    const dropZone = document.getElementById('resize-dropZone');
    const editorView = document.getElementById('resize-editorView');
    const previewSection = document.getElementById('resize-previewSection');
    const previewImg = document.getElementById('resize-previewImg');
    const processingOverlay = document.getElementById('resize-processingOverlay');
    const successView = document.getElementById('resize-successView');
    const resizedImg = document.getElementById('resize-resizedImg');
    const downloadBtn = document.getElementById('resize-downloadBtn');
    const resizeAnotherBtn = document.getElementById('resize-resizeAnotherBtn');
    const exportBtn = document.getElementById('resize-exportBtn');
    const resizeMethod = document.getElementById('resize-resizeMethod');
    const platformSelect = document.getElementById('resize-platformSelect');
    const presetTypeContainer = document.getElementById('resize-presetTypeContainer');
    const presetTypeSelect = document.getElementById('resize-presetTypeSelect');
    const widthInput = document.getElementById('resize-widthInput');
    const heightInput = document.getElementById('resize-heightInput');
    const percentInput = document.getElementById('resize-percentInput');
    const finalWidthDisplay = document.getElementById('resize-finalWidthDisplay');
    const finalHeightDisplay = document.getElementById('resize-finalHeightDisplay');

    let currentFile = null;
    let currentBase64 = '';
    let originalWidth = 0;
    let originalHeight = 0;

    selectBtn.addEventListener('click', () => fileInput.click());
    resizeAnotherBtn.addEventListener('click', () => {
      dropZone.style.display = 'block';
      editorView.style.display = 'none';
      fileInput.value = '';
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function handleFiles(list) {
      const files = Array.from(list || []).filter(f => /^image\//.test(f.type));
      if (!files.length) return;
      if (files[0].size > 10 * 1024 * 1024) {
        alert('File exceeds 10 MB');
        return;
      }
      processFile(files[0]);
    }

    async function processFile(file) {
      currentFile = file;
      currentBase64 = await fileToBase64(file);
      const img = new Image();
      img.onload = () => {
        originalWidth = img.width;
        originalHeight = img.height;
        previewImg.src = img.src;
        document.getElementById('resize-imageDimensions').textContent = `Original: ${originalWidth} × ${originalHeight} px`;
        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        dropZone.style.display = 'none';
        editorView.style.display = 'block';
        previewSection.style.display = 'block';
        successView.style.display = 'none';
        updateUIForMethod();
        platformSelect.dispatchEvent(new Event('change'));
      };
      img.src = URL.createObjectURL(file);
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    resizeMethod.addEventListener('change', updateUIForMethod);

    function updateUIForMethod() {
      const method = resizeMethod.value;
      document.getElementById('resize-socialMediaOptions').style.display = method === 'socialMedia' ? 'block' : 'none';
      document.getElementById('resize-bySizeOptions').style.display = method === 'bySize' ? 'block' : 'none';
      document.getElementById('resize-byPercentOptions').style.display = method === 'byPercent' ? 'block' : 'none';
      document.getElementById('resize-aspectRatioControl').style.display = method === 'bySize' ? 'block' : 'none';
      updateDimensionsDisplay();
    }

    function updateDimensionsDisplay() {
      const method = resizeMethod.value;
      if (method === 'socialMedia') {
        const platform = platformSelect.value;
        const presetIdx = parseInt(presetTypeSelect.value || 0);
        if (SOCIAL_PRESETS[platform] && SOCIAL_PRESETS[platform][presetIdx]) {
          const preset = SOCIAL_PRESETS[platform][presetIdx];
          finalWidthDisplay.value = preset.width;
          finalHeightDisplay.value = preset.height;
          document.getElementById('resize-dimensionsDisplay').style.display = 'block';
        }
      } else if (method === 'bySize') {
        const w = parseInt(widthInput.value);
        const h = parseInt(heightInput.value);
        if (w > 0 && h > 0) {
          finalWidthDisplay.value = w;
          finalHeightDisplay.value = h;
          document.getElementById('resize-dimensionsDisplay').style.display = 'block';
        }
      } else if (method === 'byPercent') {
        const percent = parseFloat(percentInput.value);
        if (percent > 0 && originalWidth > 0) {
          finalWidthDisplay.value = Math.round(originalWidth * (percent / 100));
          finalHeightDisplay.value = Math.round(originalHeight * (percent / 100));
          document.getElementById('resize-dimensionsDisplay').style.display = 'block';
        }
      }
    }

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
      }
    });

    presetTypeSelect.addEventListener('change', updateDimensionsDisplay);
    widthInput.addEventListener('input', updateDimensionsDisplay);
    heightInput.addEventListener('input', updateDimensionsDisplay);
    percentInput.addEventListener('input', updateDimensionsDisplay);

    exportBtn.addEventListener('click', async () => {
      if (!currentBase64) return;
      let targetWidth, targetHeight;
      const method = resizeMethod.value;

      if (method === 'bySize') {
        targetWidth = parseInt(widthInput.value);
        targetHeight = parseInt(heightInput.value);
      } else if (method === 'byPercent') {
        const percent = parseFloat(percentInput.value);
        targetWidth = Math.round(originalWidth * (percent / 100));
        targetHeight = Math.round(originalHeight * (percent / 100));
      } else if (method === 'socialMedia') {
        const platform = platformSelect.value;
        const presetIdx = parseInt(presetTypeSelect.value);
        const preset = SOCIAL_PRESETS[platform][presetIdx];
        targetWidth = preset.width;
        targetHeight = preset.height;
      }

      if (!targetWidth || !targetHeight) {
        alert('Invalid dimensions');
        return;
      }

      previewSection.style.display = 'none';
      document.querySelector('.resize-settings').style.display = 'none';
      processingOverlay.style.display = 'flex';

      try {
        const res = await fetchWithTimeout(API_BASE + '/resize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: currentBase64, width: targetWidth, height: targetHeight })
        });

        const data = await res.json();
        if (!data.resized_image_base64) throw new Error(data.error || 'Resize failed');

        const mimeType = currentFile.type || 'image/png';
        const fileExt = mimeType.split('/')[1] || 'png';
        const downloadUrl = `data:${mimeType};base64,${data.resized_image_base64}`;
        resizedImg.src = downloadUrl;
        document.getElementById('resize-successDimensions').textContent = `New size: ${targetWidth} × ${targetHeight} pixels`;
        downloadBtn.href = downloadUrl;
        downloadBtn.download = `${(currentFile.name || 'image').replace(/\.[^.]+$/, '')}-${targetWidth}x${targetHeight}.${fileExt}`;
        processingOverlay.style.display = 'none';
        successView.style.display = 'block';
      } catch (err) {
        console.error(err);
        processingOverlay.style.display = 'none';
        alert('Failed to resize: ' + err.message);
        previewSection.style.display = 'block';
        document.querySelector('.resize-settings').style.display = 'block';
      }
    });
  }

  // Export for use in other modules
  window.initResizePage = initResizePage;

})();
