/**
 * Indian Competitive Exams Common Resizer Logic
 * Handles image resizing for UPSC, JEE, NEET, SSC, GATE
 */

(function () {
    'use strict';

    // Specific Exam Preset Configurations
    const EXAM_PRESETS = {
        // UPSC: https://upsc.gov.in/
        // Photo: 350x350 min, Max 1000x1000. 300dpi means 3.5cm ~= 413px
        // Using 450x600 for Photo to be safe and standard passport ratio, or 350x350 if they want square? 
        // UPSC notification says >350x350. Usually passport is 3.5x4.5cm.
        // Let's use standard high quality passport size 413x531 (3.5x4.5cm @ 300dpi)
        'upsc-photo': {
            width: 413,
            height: 531,
            name: 'UPSC Photograph (3.5cm × 4.5cm)',
            kbLimit: 300,
            minKb: 20
        },
        'upsc-signature': {
            width: 550,
            height: 550, // Square canvas for signature to satisfy 350x350 min rule safely
            name: 'UPSC Signature (550 × 550 px)', // 3:4 aspect or similar? UPSC requirement says: "Pixel resolution: 350 x 350".
            // It's often safer to use a square canvas that contains the rectangular signature
            kbLimit: 300,
            minKb: 20,
            fit: 'contain'
        },

        // JEE / NEET (NTA)
        'nta-passport': {
            width: 413,
            height: 531,
            name: 'Passport Size Photo (3.5cm × 4.5cm)',
            kbLimit: 200,
            minKb: 10
        },
        'nta-postcard': {
            width: 1200,
            height: 1800, // 4x6 inches @ 300dpi
            name: 'Postcard Size Photo (4" × 6")',
            kbLimit: 200,
            minKb: 10
        },
        'nta-signature': {
            width: 413,
            height: 177, // 3.5cm x 1.5cm @ 300dpi
            name: 'Signature (3.5cm × 1.5cm)',
            kbLimit: 30,
            minKb: 4
        },

        // SSC
        'ssc-photo': {
            width: 413,
            height: 531,
            name: 'SSC Photograph (3.5cm × 4.5cm)',
            kbLimit: 50,
            minKb: 20
        },
        'ssc-signature': {
            width: 472,
            height: 236, // 4.0cm x 2.0cm @ 300dpi
            name: 'SSC Signature (4.0cm × 2.0cm)',
            kbLimit: 20,
            minKb: 10
        },

        // GATE
        'gate-photo': {
            width: 480,
            height: 640,
            name: 'GATE Photograph (480 × 640 px)',
            kbLimit: 600, // Varies, but usually generous max
            minKb: 5
        },
        'gate-signature': {
            width: 560,
            height: 160,
            name: 'GATE Signature (560 × 160 px)',
            kbLimit: 300,
            minKb: 5
        }
    };

    /**
     * Initialize the Exam Resizer
     * @param {string} examId - 'upsc', 'jee-neet', 'ssc', 'gate'
     */
    function initExamResizer(examId) {
        console.log(`Initializing ${examId} Resizer`);

        // State
        let currentPresetKey = null;
        let currentFile = null;
        let currentBase64 = '';

        // DOM Elements
        const dropZone = document.getElementById('resizeDropZone');
        const fileInput = document.getElementById('resizeFileInput');
        const editorView = document.getElementById('resizeEditorView');
        const previewImg = document.getElementById('resizePreviewImg');
        const successView = document.getElementById('resizeSuccessView');
        const resizedImg = document.getElementById('resizeResizedImg');
        const downloadBtn = document.getElementById('resizeDownloadBtn');
        const exportBtn = document.getElementById('resizeExportBtn');
        const presetOptions = document.querySelectorAll('.doc-type-card');

        // 1. Setup Preset Selection
        presetOptions.forEach(card => {
            card.addEventListener('click', () => {
                // Remove active class from all
                presetOptions.forEach(c => c.classList.remove('active'));
                // Add active to clicked
                card.classList.add('active');
                currentPresetKey = card.dataset.preset;

                // Update export button text
                if (exportBtn && currentPresetKey) {
                    const preset = EXAM_PRESETS[currentPresetKey];
                    exportBtn.innerHTML = `Resize to ${preset.width}×${preset.height} px`;
                }

                // If file is already loaded, potentially re-render dimensions info
                if (currentFile) {
                    updateDimensionsDisplay();
                }
            });
        });

        // Select first preset by default
        if (presetOptions.length > 0) {
            presetOptions[0].click();
        }

        // 2. File Input Handling
        if (dropZone) {
            dropZone.addEventListener('click', (e) => {
                if (!e.target.closest('.doc-type-card') && !e.target.closest('h2') && !e.target.closest('p')) {
                    fileInput.click();
                }
            });

            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag');
                handleFiles(e.dataTransfer.files);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', () => handleFiles(fileInput.files));
        }

        // Export Handler
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }

        // 3. Reset Handler
        const resetBtn = document.getElementById('resizeAnotherBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                successView.classList.remove('show');
                editorView.style.display = 'none';
                dropZone.style.display = 'block';
                currentFile = null;
                currentBase64 = '';
                fileInput.value = '';
            });
        }

        // 4. Upload Another Image Handler (in editor view)
        const uploadAnotherBtn = document.getElementById('uploadAnotherImageBtn');
        if (uploadAnotherBtn) {
            uploadAnotherBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // -- Helpers --

        async function handleFiles(files) {
            if (!files || files.length === 0) return;
            const file = files[0];

            try {
                currentFile = file;
                currentBase64 = await fileToBase64(file);

                // Setup Editor
                previewImg.src = currentBase64;
                dropZone.style.display = 'none';
                editorView.style.display = 'block';
                updateDimensionsDisplay();

            } catch (err) {
                alert('Error loading image: ' + err.message);
            }
        }

        function updateDimensionsDisplay() {
            const infoEl = document.getElementById('resizeImageDimensions');
            if (!infoEl || !currentPresetKey) return;

            const preset = EXAM_PRESETS[currentPresetKey];
            const img = new Image();
            img.src = currentBase64;
            img.onload = () => {
                infoEl.innerHTML = `
                <strong>Original:</strong> ${img.naturalWidth} × ${img.naturalHeight} px<br>
                <strong>Target:</strong> ${preset.width} × ${preset.height} px (${preset.name})
            `;
            }
        }

        async function handleExport() {
            if (!currentBase64 || !currentPresetKey) {
                alert('Please select an image first.');
                return;
            }

            // UX: Show loading state
            const originalBtnText = exportBtn.innerHTML;
            exportBtn.innerHTML = '⚙️ Processing...';
            exportBtn.disabled = true;
            exportBtn.style.opacity = '0.7';
            exportBtn.style.cursor = 'wait';

            try {
                // Allow UI to update before heavy processing
                await new Promise(r => setTimeout(r, 50));

                const preset = EXAM_PRESETS[currentPresetKey];
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = preset.width;
                canvas.height = preset.height;

                // Draw Logic (Fit Contain with White Background)
                const img = new Image();
                img.src = currentBase64;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Failed to load image'));
                });

                // Fill White (Essential for clear background on transparent PNGs or if aspect ratio differs)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Calculate scaling to 'contain' the image
                const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
                const w = img.naturalWidth * scale;
                const h = img.naturalHeight * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;

                // Draw image centered
                ctx.drawImage(img, x, y, w, h);

                // Compress to meet KB limit (Simple approximation)
                // Start high, reduce if needed. 
                // Note: accurate KB targeting requires a loop which can be slow.
                let quality = 0.92;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // Simple iterative compression if file size is too big
                // We estimate base64 length: size in bytes ~= length * 0.75
                const targetBytes = preset.kbLimit * 1024;
                let estimatedBytes = Math.round(dataUrl.length * 0.75);

                let iterations = 0;
                while (estimatedBytes > targetBytes && quality > 0.5 && iterations < 5) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                    estimatedBytes = Math.round(dataUrl.length * 0.75);
                    iterations++;
                }

                // Also check min size? Increasing size is harder (padding metadata?), usually not an issue with high quality JPEGs 
                // unless the image is tiny. We'll skip min-size enforcement for now as it's rare to be *too* small with high RES photos.

                // Show Success
                if (resizedImg) resizedImg.src = dataUrl;
                if (successView) successView.classList.add('show');

                if (downloadBtn) {
                    downloadBtn.href = dataUrl;
                    downloadBtn.download = `${examId}-resized-${Date.now()}.jpg`;

                    // Helper text for KB
                    const kbSize = (estimatedBytes / 1024).toFixed(1);
                    const successMsg = successView.querySelector('.success-message div');
                    if (successMsg) successMsg.innerHTML = `✓ Resized to ${preset.width}x${preset.height}px (${kbSize} KB)`;
                }

                // Scroll to result
                if (successView) successView.scrollIntoView({ behavior: 'smooth', block: 'center' });

            } catch (error) {
                console.error('Export error:', error);
                alert('Failed to process image. Please try another file.');
            } finally {
                // Reset button
                exportBtn.innerHTML = originalBtnText;
                exportBtn.disabled = false;
                exportBtn.style.opacity = '1';
                exportBtn.style.cursor = 'pointer';
            }
        }

        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
    }

    // Export
    window.initExamResizer = initExamResizer;

})();
