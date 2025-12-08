// Background Removal Module
// Using TensorFlow.js with BodyPix for AI-powered segmentation

(function () {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const removeBackgroundSection = document.getElementById('removeBackgroundSection');
        if (!removeBackgroundSection) return;

        const fileInput = document.getElementById('fileInput');
        const selectBtn = document.getElementById('selectBtn');
        const dropZone = document.getElementById('dropZone');
        const editorView = document.getElementById('editorView');
        const cropCanvas = document.getElementById('cropCanvas');
        const sliderContainer = document.getElementById('sliderContainer');
        const beforeImg = document.getElementById('beforeImg');
        const afterImg = document.getElementById('afterImg');
        const beforeContainer = document.getElementById('beforeContainer');
        const sliderHandle = document.getElementById('sliderHandle');
        const changeImageBtn = document.getElementById('changeImageBtn');
        const bgGallery = document.getElementById('bgGallery');
        const editorProcessingOverlay = document.getElementById('editorProcessingOverlay');
        const downloadBtn = document.getElementById('downloadBtn');
        const removeBackgroundBtn = document.getElementById('removeBackgroundBtn');
        const successView = document.getElementById('successView');
        const convertedImage = document.getElementById('convertedImage');
        const removeAnotherBtn = document.getElementById('removeAnotherBtn');
        const canvasContainer = document.getElementById('canvasContainer');

        let currentFile = null;
        let originalImageUrl = '';
        let selectedPreset = null;
        let processedImageBlob = null;
        let processedImageUrl = '';
        let bodyPixNet = null;

        const PRESETS = [
            { id: 'transparent', label: 'Transparent', icon: '🔲', mode: 'transparent' },
            { id: 'white', label: 'White', color: '#ffffff', mode: 'solid', rgb: [255, 255, 255] },
            { id: 'blue', label: 'Blue', color: '#3b82f6', mode: 'solid', rgb: [59, 130, 246] },
            { id: 'gray', label: 'Gray', color: '#6b7280', mode: 'solid', rgb: [107, 114, 128] },
            { id: 'green', label: 'Green', color: '#10b981', mode: 'solid', rgb: [16, 185, 129] },
            { id: 'red', label: 'Red', color: '#ef4444', mode: 'solid', rgb: [239, 68, 68] }
        ];

        PRESETS.forEach(p => {
            const tile = document.createElement('div');
            tile.className = 'rbx-gallery-tile';
            tile.dataset.id = p.id;
            if (p.color) tile.style.background = p.color;
            if (p.icon) {
                const icon = document.createElement('div');
                icon.className = 'icon';
                icon.textContent = p.icon;
                tile.appendChild(icon);
            }
            const lbl = document.createElement('div');
            lbl.className = 'label';
            lbl.textContent = p.label;
            tile.appendChild(lbl);
            tile.addEventListener('click', () => selectBackground(p.id));
            bgGallery.appendChild(tile);
        });

        const style = document.createElement('style');
        style.textContent = `
      .rbx-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:12px;margin-top:12px}
      .rbx-gallery-tile{position:relative;aspect-ratio:1;border:2px solid var(--light-border);border-radius:10px;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f8fafc;transition:all 0.2s}
      .rbx-gallery-tile:hover{border-color:#a5b4fc;transform:scale(1.05)}
      .rbx-gallery-tile.selected{border-color:var(--primary-500);box-shadow:0 0 0 2px rgba(91,140,255,0.2)}
      .rbx-gallery-tile img{width:100%;height:100%;object-fit:cover}
      .rbx-gallery-tile .icon{font-size:32px}
      .rbx-gallery-tile .label{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:11px;font-weight:600;background:rgba(255,255,255,0.9);padding:2px}
      .control-card{background:white;border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid rgba(102,126,234,0.1)}
      .control-card h4{margin:0 0 12px 0;font-size:16px;font-weight:600;color:var(--light-text)}
      .convert-action-btn{width:100%;padding:12px 20px;background:linear-gradient(135deg,#5b8cff 0%,#3b82f6 100%);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(91,140,255,0.3)}
      .convert-action-btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(91,140,255,0.4)}
      .convert-action-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
      .success-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1001;align-items:center;justify-content:center}
      .success-modal.show{display:flex}
      .success-modal-content{background:white;border-radius:16px;padding:32px;max-width:500px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
      .success-message{margin-bottom:24px}
      .success-message div:first-child{font-size:24px;font-weight:700;color:#10b981;margin-bottom:8px}
      .success-message div:last-child{font-size:14px;color:var(--light-muted)}
      .success-image{margin-bottom:24px;max-height:300px;overflow:hidden;border-radius:12px;background:repeating-conic-gradient(#eef2f7 0% 25%,#fff 0% 50%) 50%/16px 16px}
      .success-image img{max-width:100%;max-height:300px;display:block;margin:0 auto}
      .success-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
      .sr-only{position:absolute!important;height:1px;width:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);white-space:nowrap}
    `;
        document.head.appendChild(style);

        // Load TensorFlow.js and BodyPix
        async function loadModel() {
            try {
                console.log('Loading TensorFlow.js and BodyPix...');
                removeBackgroundBtn.textContent = '⏳ Loading AI (Step 1/2)...';
                removeBackgroundBtn.disabled = true;

                if (!window.tf) {
                    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js');
                }

                removeBackgroundBtn.textContent = '⏳ Loading AI (Step 2/2)...';

                if (!window.bodyPix) {
                    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0/dist/body-pix.min.js');
                }

                removeBackgroundBtn.textContent = '⏳ Initializing Model...';

                bodyPixNet = await bodyPix.load({
                    architecture: 'MobileNetV1',
                    outputStride: 16,
                    multiplier: 0.75,
                    quantBytes: 2
                });

                console.log('✅ BodyPix loaded!');
                removeBackgroundBtn.textContent = '✂️ Remove Background';
                removeBackgroundBtn.disabled = false;
            } catch (error) {
                console.error('❌ Failed to load:', error);
                removeBackgroundBtn.textContent = '⚠️ Load Failed - Click to Retry';
                removeBackgroundBtn.disabled = false;
                removeBackgroundBtn.addEventListener('click', function retry() {
                    removeBackgroundBtn.removeEventListener('click', retry);
                    loadModel();
                }, { once: true });
            }
        }

        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        loadModel();

        selectBtn.addEventListener('click', () => fileInput.click());
        changeImageBtn.addEventListener('click', () => {
            fileInput.click();
            resetState();
        });
        removeAnotherBtn.addEventListener('click', () => {
            successView.classList.remove('show');
            fileInput.click();
            resetState();
        });

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

        removeBackgroundBtn.addEventListener('click', removeBackground);

        let isDragging = false;
        sliderHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = sliderContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            updateSlider(percentage);
        });
        document.addEventListener('mouseup', () => { isDragging = false; });

        sliderHandle.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
        });
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const rect = sliderContainer.getBoundingClientRect();
            const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            updateSlider(percentage);
        });
        document.addEventListener('touchend', () => { isDragging = false; });

        function updateSlider(percentage) {
            beforeContainer.style.width = percentage + '%';
            sliderHandle.style.left = percentage + '%';
        }

        function handleFiles(list) {
            const files = Array.from(list || []).filter(f => /^image\//.test(f.type));
            if (!files.length) return;
            processFile(files[0]);
        }

        function processFile(file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }

            currentFile = file;
            const fileUrl = URL.createObjectURL(file);
            originalImageUrl = fileUrl;
            cropCanvas.src = fileUrl;
            beforeImg.src = fileUrl;

            dropZone.style.display = 'none';
            editorView.style.display = 'block';

            resetState();
        }

        function resetState() {
            sliderContainer.style.display = 'none';
            cropCanvas.style.display = 'block';
            downloadBtn.style.display = 'none';
            successView.classList.remove('show');
            processedImageBlob = null;
            processedImageUrl = '';
            selectedPreset = null;
            document.querySelectorAll('.rbx-gallery-tile').forEach(t => t.classList.remove('selected'));
        }

        function selectBackground(id) {
            selectedPreset = PRESETS.find(p => p.id === id);
            document.querySelectorAll('.rbx-gallery-tile').forEach(t =>
                t.classList.toggle('selected', t.dataset.id === id)
            );

            if (processedImageBlob) {
                applyBackground();
            }
        }

        async function removeBackground() {
            if (!currentFile) return;

            if (!bodyPixNet) {
                alert('AI model is still loading. Please wait...');
                return;
            }

            showProcessingOverlay(true);
            removeBackgroundBtn.disabled = true;

            try {
                const result = await removeBackgroundWithAI(currentFile);

                processedImageBlob = result;
                processedImageUrl = URL.createObjectURL(result);

                if (selectedPreset) {
                    await applyBackground();
                } else {
                    showResult(processedImageUrl);
                }

            } catch (err) {
                console.error('Failed:', err);
                alert('Failed to remove background: ' + err.message);
            } finally {
                showProcessingOverlay(false);
                removeBackgroundBtn.disabled = false;
            }
        }

        async function removeBackgroundWithAI(file) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const reader = new FileReader();

                reader.onload = async (e) => {
                    img.onload = async () => {
                        try {
                            const segmentation = await bodyPixNet.segmentPersonParts(img, {
                                flipHorizontal: false,
                                internalResolution: 'medium',
                                segmentationThreshold: 0.5,
                                maxDetections: 10,
                                scoreThreshold: 0.3,
                                nmsRadius: 20,
                                minKeypointScore: 0.3,
                                refineSteps: 10
                            });

                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);

                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;

                            const partData = segmentation.data;
                            const personMask = new Uint8Array(partData.length);
                            for (let i = 0; i < partData.length; i++) {
                                personMask[i] = partData[i] >= 0 ? 1 : 0;
                            }

                            const improvedMask = improveMask(personMask, canvas.width, canvas.height);

                            for (let i = 0; i < personMask.length; i++) {
                                data[i * 4 + 3] = improvedMask[i];
                            }

                            ctx.putImageData(imageData, 0, 0);

                            canvas.toBlob((blob) => {
                                if (blob) {
                                    resolve(blob);
                                } else {
                                    reject(new Error('Failed to create blob'));
                                }
                            }, 'image/png');

                        } catch (err) {
                            reject(err);
                        }
                    };
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });
        }

        function improveMask(mask, width, height) {
            // Step 1: Moderate dilation to catch clothing edges
            let filled = morphDilate(mask, width, height, 5);

            // Step 2: Erosion to restore edges (slightly less than dilation)
            filled = morphErode(filled, width, height, 4);

            // Step 3: Fill only small holes (not large gaps between people)
            filled = fillHoles(filled, width, height, 300);

            // Step 4: Light dilation to smooth
            filled = morphDilate(filled, width, height, 2);

            // Step 5: Convert to alpha with edge smoothing
            return convertToAlpha(filled, width, height);
        }

        function morphDilate(mask, width, height, k) {
            const result = new Uint8Array(mask.length);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let max = mask[y * width + x];
                    for (let dy = -k; dy <= k; dy++) {
                        for (let dx = -k; dx <= k; dx++) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                max = Math.max(max, mask[ny * width + nx]);
                            }
                        }
                    }
                    result[y * width + x] = max;
                }
            }
            return result;
        }

        function morphErode(mask, width, height, k) {
            const result = new Uint8Array(mask.length);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let min = mask[y * width + x];
                    for (let dy = -k; dy <= k; dy++) {
                        for (let dx = -k; dx <= k; dx++) {
                            const nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                min = Math.min(min, mask[ny * width + nx]);
                            }
                        }
                    }
                    result[y * width + x] = min;
                }
            }
            return result;
        }

        function fillConvexHull(mask, width, height) {
            let result = new Uint8Array(mask);

            for (let y = 0; y < height; y++) {
                let first = -1, last = -1;
                for (let x = 0; x < width; x++) {
                    if (result[y * width + x] === 1) {
                        if (first === -1) first = x;
                        last = x;
                    }
                }
                if (first !== -1 && last !== -1) {
                    for (let x = first; x <= last; x++) {
                        result[y * width + x] = 1;
                    }
                }
            }

            for (let x = 0; x < width; x++) {
                let first = -1, last = -1;
                for (let y = 0; y < height; y++) {
                    if (result[y * width + x] === 1) {
                        if (first === -1) first = y;
                        last = y;
                    }
                }
                if (first !== -1 && last !== -1) {
                    for (let y = first; y <= last; y++) {
                        result[y * width + x] = 1;
                    }
                }
            }

            return result;
        }

        function fillHoles(mask, width, height, maxSize) {
            const result = new Uint8Array(mask);
            const visited = new Uint8Array(width * height);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (!visited[idx] && mask[idx] === 0) {
                        const region = floodFill(mask, visited, x, y, width, height);
                        if (region.length < maxSize) {
                            region.forEach(i => result[i] = 1);
                        }
                    }
                }
            }
            return result;
        }

        function floodFill(mask, visited, startX, startY, width, height) {
            const region = [];
            const queue = [[startX, startY]];
            visited[startY * width + startX] = 1;

            while (queue.length > 0) {
                const [x, y] = queue.shift();
                region.push(y * width + x);

                [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dy]) => {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = ny * width + nx;
                        if (!visited[nIdx] && mask[nIdx] === 0) {
                            visited[nIdx] = 1;
                            queue.push([nx, ny]);
                        }
                    }
                });
            }
            return region;
        }

        function convertToAlpha(mask, width, height) {
            const alpha = new Uint8Array(mask.length);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (mask[idx] === 1) {
                        let count = 0, total = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny = y + dy;
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    if (mask[ny * width + nx] === 1) count++;
                                    total++;
                                }
                            }
                        }
                        alpha[idx] = count < total ? Math.floor((count / total) * 255) : 255;
                    } else {
                        alpha[idx] = 0;
                    }
                }
            }
            return alpha;
        }

        async function applyBackground() {
            if (!processedImageBlob || !selectedPreset) return;
            showProcessingOverlay(true);
            try {
                if (selectedPreset.mode === 'transparent') {
                    showResult(processedImageUrl);
                } else {
                    const resultUrl = await addSolidBackground(processedImageBlob, selectedPreset.rgb);
                    showResult(resultUrl);
                }
            } catch (err) {
                console.error('Failed:', err);
                alert('Failed to apply background');
            } finally {
                showProcessingOverlay(false);
            }
        }

        async function addSolidBackground(blob, rgb) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((resultBlob) => {
                        resolve(URL.createObjectURL(resultBlob));
                    }, 'image/png');
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(blob);
            });
        }

        function showResult(resultUrl) {
            afterImg.src = resultUrl;
            beforeImg.src = originalImageUrl;
            let imagesLoaded = 0;
            const checkLoaded = () => {
                imagesLoaded++;
                if (imagesLoaded === 2) {
                    cropCanvas.style.display = 'none';
                    sliderContainer.style.display = 'block';
                    setTimeout(() => {
                        const containerWidth = canvasContainer.offsetWidth;
                        const containerHeight = canvasContainer.offsetHeight;
                        beforeImg.style.width = containerWidth + 'px';
                        beforeImg.style.height = containerHeight + 'px';
                        updateSlider(50);
                    }, 10);
                }
            };
            beforeImg.onload = checkLoaded;
            afterImg.onload = checkLoaded;
            const fileName = (currentFile.name || 'image').replace(/\.[^.]+$/, '') +
                (selectedPreset ? '-' + selectedPreset.id : '-no-bg') + '.png';
            downloadBtn.href = resultUrl;
            downloadBtn.download = fileName;
            convertedImage.src = resultUrl;
            successView.classList.add('show');
        }

        function showProcessingOverlay(show) {
            if (show) {
                editorProcessingOverlay.style.display = 'block';
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                    editorProcessingOverlay.querySelector('.processing-mobile').style.display = 'block';
                    editorProcessingOverlay.querySelector('.processing-desktop').style.display = 'none';
                } else {
                    editorProcessingOverlay.querySelector('.processing-mobile').style.display = 'none';
                    editorProcessingOverlay.querySelector('.processing-desktop').style.display = 'block';
                }
            } else {
                editorProcessingOverlay.style.display = 'none';
            }
        }
    }
})();
