/**
 * IBPS Image Resizer JavaScript functionality
 * Handles image resizing for IBPS Exam requirements
 */

(function() {
  'use strict';

  // IBPS Requirements
  const IBPS_PRESETS = {
    photo: {
      name: { en: 'Photograph', hi: 'तस्वीर' },
      width: 200,
      height: 230,
      minSize: 20,
      maxSize: 50,
      desc: { en: '200 x 230 pixels (20KB - 50KB)', hi: '200 x 230 पिक्सेल (20KB - 50KB)' }
    },
    signature: {
      name: { en: 'Signature', hi: 'हस्ताक्षर' },
      width: 140,
      height: 60,
      minSize: 10,
      maxSize: 20,
      desc: { en: '140 x 60 pixels (10KB - 20KB)', hi: '140 x 60 पिक्सेल (10KB - 20KB)' }
    },
    thumb: {
      name: { en: 'Left Thumb Impression', hi: 'बाएं अंगूठे का निशान' },
      width: 240,
      height: 240,
      minSize: 20,
      maxSize: 50,
      desc: { en: '240 x 240 pixels (20KB - 50KB)', hi: '240 x 240 पिक्सेल (20KB - 50KB)' }
    },
    declaration: {
      name: { en: 'Handwritten Declaration', hi: 'हस्तलिखित घोषणा' },
      width: 800,
      height: 400,
      minSize: 50,
      maxSize: 100,
      desc: { en: '800 x 400 pixels (50KB - 100KB)', hi: '800 x 400 पिक्सेल (50KB - 100KB)' }
    }
  };

  const TRANSLATIONS = {
    en: {
      title: 'IBPS Image Resizer',
      subtitle: 'Resize your photo, signature, thumb impression, and declaration for IBPS exam applications accurately.',
      selectBtn: 'Select Image',
      dropHint: 'or drag & drop',
      formats: 'Supported formats: HEIC, JPEG, PNG, WebP',
      maxSize: 'Max size: 10 MB',
      methodLabel: 'Select Document Type',
      exportBtn: 'Resize for IBPS',
      successTitle: '✓ Ready for IBPS!',
      downloadBtn: 'Download Image',
      anotherBtn: 'Resize Another',
      originalDim: 'Original Dimensions',
      targetDim: 'Target Dimensions',
      fileSizeNote: 'Note: We optimize quality to stay within IBPS size limits.',
      instructions: 'Instructions',
      step1: 'Select the type of document you want to resize.',
      step2: 'Upload your image (JPEG, PNG, or HEIC).',
      step3: 'Click "Resize for IBPS" to get the perfect dimensions and file size.',
      step4: 'Download and upload to your IBPS application.'
    },
    hi: {
      title: 'IBPS इमेज रिसाइजर',
      subtitle: 'IBPS परीक्षा के आवेदनों के लिए अपनी फोटो, हस्ताक्षर, अंगूठे के निशान और घोषणा को सटीक रूप से रिसाइज करें।',
      selectBtn: 'इमेज चुनें',
      dropHint: 'या ड्रैग एंड ड्रॉप करें',
      formats: 'समर्थित प्रारूप: HEIC, JPEG, PNG, WebP',
      maxSize: 'अधिकतम आकार: 10 MB',
      methodLabel: 'दस्तावेज़ का प्रकार चुनें',
      exportBtn: 'IBPS के लिए रिसाइज करें',
      successTitle: '✓ IBPS के लिए तैयार!',
      downloadBtn: 'इमेज डाउनलोड करें',
      anotherBtn: 'दूसरा रिसाइज करें',
      originalDim: 'मूल आयाम',
      targetDim: 'लक्ष्य आयाम',
      fileSizeNote: 'नोट: हम IBPS आकार सीमा के भीतर रहने के लिए गुणवत्ता को अनुकूलित करते हैं।',
      instructions: 'निर्देश',
      step1: 'उस दस्तावेज़ का प्रकार चुनें जिसे आप रिसाइज करना चाहते हैं।',
      step2: 'अपनी इमेज अपलोड करें (JPEG, PNG, या HEIC)।',
      step3: 'सटीक आयाम और फ़ाइल आकार प्राप्त करने के लिए "IBPS के लिए रिसाइज करें" पर क्लिक करें।',
      step4: 'डाउनलोड करें और अपने IBPS आवेदन में अपलोड करें।'
    }
  };

  let currentLang = 'en';
  let currentFile = null;
  let currentBase64 = '';
  let originalWidth = 0;
  let originalHeight = 0;
  let selectedPreset = 'photo';

  function detectLanguage() {
    const path = window.location.pathname;
    if (path.includes('/hi/')) {
      currentLang = 'hi';
    } else if (path.includes('/en/')) {
      currentLang = 'en';
    } else {
      // Default to English if not specified
      currentLang = 'en';
    }
    console.log('Language detected:', currentLang);
  }

  function initIBPSPage() {
    console.log('IBPS Resize page initialized');
    detectLanguage();
    setupEventListeners();
    updateUI();
  }

  function setupEventListeners() {
    const fileInput = document.getElementById('resizeFileInput');
    const selectBtn = document.getElementById('resizeSelectBtn');
    const dropZone = document.getElementById('resizeDropZone');
    const exportBtn = document.getElementById('resizeExportBtn');
    const anotherBtn = document.getElementById('resizeAnotherBtn');
    const langToggle = document.getElementById('langToggle');

    if (selectBtn) selectBtn.addEventListener('click', () => fileInput.click());
    if (anotherBtn) anotherBtn.addEventListener('click', resetToUploader);
    
    if (dropZone) {
      dropZone.addEventListener('click', (e) => {
        if (!e.target.closest('#resizeSelectBtn')) fileInput.click();
      });
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
      dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    }

    if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    
    if (exportBtn) exportBtn.addEventListener('click', handleExport);

    if (langToggle) {
      langToggle.addEventListener('click', () => {
        const newLang = currentLang === 'en' ? 'hi' : 'en';
        // Navigate to the correct localized URL
        const currentPath = window.location.pathname;
        let newPath = currentPath;
        
        if (currentLang === 'en' && !currentPath.includes('/en/')) {
           newPath = currentPath.replace('/resize/', '/hi/resize/');
        } else {
           newPath = currentPath.replace(`/${currentLang}/`, `/${newLang}/`);
        }
        
        window.location.href = newPath;
      });
    }

    // Preset selection
    document.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedPreset = card.dataset.preset;
        updatePresetInfo();
      });
    });
  }

  function handleFiles(list) {
    const files = Array.from(list || []).filter(f => /^image\//.test(f.type));
    if (!files.length) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert(currentLang === 'en' ? 'File too large (max 10MB)' : 'फ़ाइल बहुत बड़ी है (अधिकतम 10MB)');
      return;
    }

    processFile(file);
  }

  async function processFile(file) {
    currentFile = file;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isHeic = ['heic', 'heif'].includes(fileExtension) || ['image/heic', 'image/heif'].includes(file.type);

    try {
      let imageBlob = file;
      if (isHeic && window.heic2any) {
        imageBlob = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
      }

      currentBase64 = await fileToBase64(imageBlob);
      const objectUrl = URL.createObjectURL(imageBlob);
      const previewImg = document.getElementById('resizePreviewImg');
      previewImg.src = objectUrl;

      previewImg.onload = () => {
        originalWidth = previewImg.naturalWidth;
        originalHeight = previewImg.naturalHeight;
        document.getElementById('resizeDropZone').style.display = 'none';
        document.getElementById('resizeEditorView').style.display = 'block';
        updatePresetInfo();
        URL.revokeObjectURL(objectUrl);
      };
    } catch (e) {
      console.error(e);
      alert('Error processing image');
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

  async function handleExport() {
    const spinner = document.getElementById('resizeSpinnerOverlay');
    spinner.style.display = 'flex';

    const preset = IBPS_PRESETS[selectedPreset];
    try {
      const resizedData = await resizeAndOptimize(currentBase64, preset.width, preset.height, preset.minSize, preset.maxSize);
      
      const resizedImg = document.getElementById('resizeResizedImg');
      resizedImg.src = resizedData.url;
      
      const downloadBtn = document.getElementById('resizeDownloadBtn');
      downloadBtn.href = resizedData.url;
      downloadBtn.download = `ibps-${selectedPreset}-${Date.now()}.jpg`;

      document.getElementById('resizeSuccessDimensions').textContent = `${preset.width} × ${preset.height} px | ${resizedData.sizeKB} KB`;
      document.getElementById('resizeSuccessView').style.display = 'flex';
    } catch (e) {
      console.error(e);
      alert('Error resizing image');
    } finally {
      spinner.style.display = 'none';
    }
  }

  async function resizeAndOptimize(base64, width, height, minKB, maxKB) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try to hit the target KB range
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let sizeKB = Math.round((dataUrl.length * 3/4) / 1024);

        // Simple iteration to adjust quality if needed
        if (sizeKB > maxKB) {
          quality = Math.max(0.1, quality * (maxKB / sizeKB));
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          sizeKB = Math.round((dataUrl.length * 3/4) / 1024);
        } else if (sizeKB < minKB && quality < 0.95) {
          // If too small, we can't do much with JPEG quality to increase size significantly 
          // but we can try slightly higher quality
          quality = 0.98;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          sizeKB = Math.round((dataUrl.length * 3/4) / 1024);
        }

        resolve({ url: dataUrl, sizeKB });
      };
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  }

  function updateUI() {
    const t = TRANSLATIONS[currentLang];
    
    // Update text content
    document.title = t.title + ' - ImageNerd';
    const h1 = document.querySelector('h1');
    if (h1) h1.textContent = t.title;
    
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) subtitle.textContent = t.subtitle;

    document.getElementById('resizeSelectBtn').querySelector('span').textContent = t.selectBtn;
    document.querySelector('.drop-hint').textContent = t.dropHint;
    document.getElementById('resize-file-limit').querySelector('span:first-child').textContent = t.formats;
    document.getElementById('resize-file-limit').querySelector('span:last-child').textContent = t.maxSize;
    
    document.getElementById('methodLabel').textContent = t.methodLabel;
    document.getElementById('resizeExportBtn').querySelector('span').textContent = t.exportBtn;
    
    document.getElementById('resize-success-heading').textContent = t.successTitle;
    document.getElementById('resizeDownloadBtn').textContent = '📥 ' + t.downloadBtn;
    document.getElementById('resizeAnotherBtn').textContent = '🔄 ' + t.anotherBtn;

    document.getElementById('langToggle').textContent = currentLang === 'en' ? 'हिन्दी' : 'English';

    // Update presets
    Object.keys(IBPS_PRESETS).forEach(key => {
      const card = document.querySelector(`.preset-card[data-preset="${key}"]`);
      if (card) {
        card.querySelector('h4').textContent = IBPS_PRESETS[key].name[currentLang];
        card.querySelector('p').textContent = IBPS_PRESETS[key].desc[currentLang];
      }
    });

    // Update Instructions
    const instrSection = document.getElementById('instructionsSection');
    if (instrSection) {
      instrSection.querySelector('h3').textContent = t.instructions;
      const items = instrSection.querySelectorAll('li');
      items[0].textContent = t.step1;
      items[1].textContent = t.step2;
      items[2].textContent = t.step3;
      items[3].textContent = t.step4;
    }

    updatePresetInfo();
  }

  function updatePresetInfo() {
    const preset = IBPS_PRESETS[selectedPreset];
    const info = document.getElementById('resizeImageDimensions');
    if (info && originalWidth > 0) {
      const t = TRANSLATIONS[currentLang];
      info.innerHTML = `
        <div>${t.originalDim}: ${originalWidth} × ${originalHeight} px</div>
        <div style="color:var(--primary-500); font-weight:bold;">${t.targetDim}: ${preset.width} × ${preset.height} px</div>
        <div style="font-size:12px; margin-top:5px; opacity:0.8;">${t.fileSizeNote}</div>
      `;
    }
  }

  function resetToUploader() {
    document.getElementById('resizeDropZone').style.display = 'block';
    document.getElementById('resizeEditorView').style.display = 'none';
    document.getElementById('resizeSuccessView').style.display = 'none';
    document.getElementById('resizeFileInput').value = '';
    currentFile = null;
    currentBase64 = '';
  }

  window.initIBPSPage = initIBPSPage;
})();
