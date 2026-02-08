/**
 * Passport Photo Maker - ImageNerd
 * Free online passport photo generator
 */

// Country specifications database
const countrySpecs = {
    'us': { width: 51, height: 51, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'United States' },
    'uk': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'United Kingdom' },
    'in': { width: 51, height: 51, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'India' },
    'ca': { width: 50, height: 70, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Canada' },
    'au': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Australia' },
    'schengen': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Schengen' },
    'de': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Germany' },
    'fr': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'France' },
    'it': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Italy' },
    'es': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Spain' },
    'nl': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Netherlands' },
    'cn': { width: 33, height: 48, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'China' },
    'jp': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Japan' },
    'kr': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'South Korea' },
    'sg': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Singapore' },
    'ae': { width: 43, height: 55, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'UAE' },
    'mx': { width: 35, height: 45, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Mexico' },
    'br': { width: 50, height: 70, unit: 'mm', dpi: 300, bg: '#FFFFFF', name: 'Brazil' }
};

// State
let currentImage = null;
let currentSpecs = countrySpecs['in'];
let selectedBackground = '#FFFFFF';
let zoomLevel = 1;
let rotation = 0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const photoUpload = document.getElementById('photoUpload');
const countrySelect = document.getElementById('country');
const docTypeSelect = document.getElementById('docType');
const sizeInfo = document.getElementById('sizeInfo');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const photoEditor = document.getElementById('photoEditor');
const previewImage = document.getElementById('previewImage');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const rotateBtn = document.getElementById('rotateBtn');
const colorBtns = document.querySelectorAll('.color-btn');
const outputFormat = document.getElementById('outputFormat');
const printLayout = document.getElementById('printLayout');
const autoRemoveBg = document.getElementById('autoRemoveBg');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateSizeInfo();
});

function setupEventListeners() {
    // Upload area events
    uploadArea.addEventListener('click', () => photoUpload.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    photoUpload.addEventListener('change', handleFileSelect);

    // Country selection
    countrySelect.addEventListener('change', handleCountryChange);
    docTypeSelect.addEventListener('change', () => trackEvent('select_doc_type', 'passport_photo', docTypeSelect.value));

    // Color buttons
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => handleColorSelect(btn));
    });

    // Zoom and rotate
    zoomInBtn.addEventListener('click', () => handleZoom(0.1));
    zoomOutBtn.addEventListener('click', () => handleZoom(-0.1));
    rotateBtn.addEventListener('click', handleRotate);

    // Actions
    downloadBtn.addEventListener('click', handleDownload);
    resetBtn.addEventListener('click', handleReset);

    // Image dragging
    if (previewImage) {
        previewImage.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        previewImage.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', endDrag);
    }
}

// File handling
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG, WebP)');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            displayPreview(img);
            downloadBtn.disabled = false;
            trackEvent('upload_photo', 'passport_photo', 'photo_uploaded');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function displayPreview(img) {
    previewImage.src = img.src;
    previewPlaceholder.style.display = 'none';
    photoEditor.style.display = 'flex';

    // Reset transformations
    zoomLevel = 1;
    rotation = 0;
    offsetX = 0;
    offsetY = 0;
    updateImageTransform();
}

// Country and specs
function handleCountryChange() {
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const countryCode = countrySelect.value;

    currentSpecs = countrySpecs[countryCode] || countrySpecs['in'];
    updateSizeInfo();
    trackEvent('select_country', 'passport_photo', countryCode);
}

function updateSizeInfo() {
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    const width = selectedOption.dataset.width || currentSpecs.width;
    const height = selectedOption.dataset.height || currentSpecs.height;
    const dpi = selectedOption.dataset.dpi || currentSpecs.dpi;

    sizeInfo.innerHTML = `
        <span class="size-badge">📐 ${width} x ${height} mm</span>
        <span class="dpi-badge">${dpi} DPI</span>
    `;
}

// Background color
function handleColorSelect(btn) {
    colorBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedBackground = btn.dataset.color;
    trackEvent('select_background', 'passport_photo', selectedBackground);
}

// Image transformations
function handleZoom(delta) {
    zoomLevel = Math.max(0.5, Math.min(3, zoomLevel + delta));
    updateImageTransform();
}

function handleRotate() {
    rotation = (rotation + 90) % 360;
    updateImageTransform();
    trackEvent('rotate_image', 'passport_photo', rotation.toString());
}

function updateImageTransform() {
    if (previewImage) {
        previewImage.style.transform = `
            scale(${zoomLevel}) 
            rotate(${rotation}deg) 
            translate(${offsetX}px, ${offsetY}px)
        `;
    }
}

// Dragging
function startDrag(e) {
    if (!currentImage) return;
    isDragging = true;
    const pos = getEventPosition(e);
    dragStartX = pos.x - offsetX;
    dragStartY = pos.y - offsetY;
    previewImage.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const pos = getEventPosition(e);
    offsetX = pos.x - dragStartX;
    offsetY = pos.y - dragStartY;
    updateImageTransform();
}

function endDrag() {
    isDragging = false;
    if (previewImage) {
        previewImage.style.cursor = 'grab';
    }
}

function getEventPosition(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

// Download
async function handleDownload() {
    if (!currentImage) {
        alert('Please upload a photo first');
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="loading"></span> Processing...';

    try {
        const canvas = await generatePassportPhoto();
        const format = outputFormat.value;
        const layout = printLayout.value;

        let finalCanvas = canvas;
        if (layout !== 'single') {
            finalCanvas = generatePrintLayout(canvas, layout);
        }

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'png' ? 1 : 0.95;

        const link = document.createElement('a');
        link.download = `passport-photo-${currentSpecs.width}x${currentSpecs.height}mm.${format}`;
        link.href = finalCanvas.toDataURL(mimeType, quality);
        link.click();

        trackEvent('download_photo', 'passport_photo', `${countrySelect.value}_${layout}`);
    } catch (error) {
        console.error('Error generating passport photo:', error);
        alert('Error generating photo. Please try again.');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 19h18v2H3v-2zm10-5.828L19.071 7.1l1.414 1.414L12 17 3.515 8.515 4.929 7.1 11 13.17V2h2v11.172z" />
            </svg>
            Download Photo
        `;
    }
}

async function generatePassportPhoto() {
    // Calculate pixel dimensions from mm at given DPI
    const dpi = currentSpecs.dpi;
    const widthPx = Math.round((currentSpecs.width / 25.4) * dpi);
    const heightPx = Math.round((currentSpecs.height / 25.4) * dpi);

    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');

    // Fill background
    if (selectedBackground === 'transparent') {
        ctx.clearRect(0, 0, widthPx, heightPx);
    } else {
        ctx.fillStyle = selectedBackground;
        ctx.fillRect(0, 0, widthPx, heightPx);
    }

    // Calculate image positioning
    const imgRatio = currentImage.width / currentImage.height;
    const canvasRatio = widthPx / heightPx;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > canvasRatio) {
        // Image is wider
        drawHeight = heightPx * zoomLevel;
        drawWidth = drawHeight * imgRatio;
    } else {
        // Image is taller
        drawWidth = widthPx * zoomLevel;
        drawHeight = drawWidth / imgRatio;
    }

    drawX = (widthPx - drawWidth) / 2 + (offsetX * zoomLevel);
    drawY = (heightPx - drawHeight) / 2 + (offsetY * zoomLevel);

    // Apply rotation
    ctx.save();
    ctx.translate(widthPx / 2, heightPx / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-widthPx / 2, -heightPx / 2);

    // Draw image
    ctx.drawImage(currentImage, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    return canvas;
}

function generatePrintLayout(photoCanvas, layout) {
    let cols, rows, paperWidth, paperHeight;

    switch (layout) {
        case '4x6-4':
            cols = 2;
            rows = 2;
            paperWidth = 1800; // 6 inches at 300 DPI
            paperHeight = 1200; // 4 inches at 300 DPI
            break;
        case '4x6-6':
            cols = 3;
            rows = 2;
            paperWidth = 1800;
            paperHeight = 1200;
            break;
        case 'a4-8':
            cols = 4;
            rows = 2;
            paperWidth = 2480; // A4 at 300 DPI (210mm)
            paperHeight = 3508; // A4 at 300 DPI (297mm)
            break;
        default:
            return photoCanvas;
    }

    const layoutCanvas = document.createElement('canvas');
    layoutCanvas.width = paperWidth;
    layoutCanvas.height = paperHeight;
    const ctx = layoutCanvas.getContext('2d');

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paperWidth, paperHeight);

    // Calculate photo placement
    const photoWidth = photoCanvas.width;
    const photoHeight = photoCanvas.height;
    const gapX = (paperWidth - (cols * photoWidth)) / (cols + 1);
    const gapY = (paperHeight - (rows * photoHeight)) / (rows + 1);

    // Draw photos in grid
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = gapX + col * (photoWidth + gapX);
            const y = gapY + row * (photoHeight + gapY);
            ctx.drawImage(photoCanvas, x, y);
        }
    }

    // Add cut lines
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
            const x = gapX + col * (photoWidth + gapX) - gapX / 2;
            const y = gapY + row * (photoHeight + gapY) - gapY / 2;

            // Vertical lines
            if (col < cols) {
                ctx.beginPath();
                ctx.moveTo(x + gapX / 2, y);
                ctx.lineTo(x + gapX / 2, y + photoHeight + gapY);
                ctx.stroke();
            }

            // Horizontal lines
            if (row < rows) {
                ctx.beginPath();
                ctx.moveTo(x, y + gapY / 2);
                ctx.lineTo(x + photoWidth + gapX, y + gapY / 2);
                ctx.stroke();
            }
        }
    }

    return layoutCanvas;
}

// Reset
function handleReset() {
    currentImage = null;
    zoomLevel = 1;
    rotation = 0;
    offsetX = 0;
    offsetY = 0;

    previewImage.src = '';
    photoEditor.style.display = 'none';
    previewPlaceholder.style.display = 'block';
    downloadBtn.disabled = true;
    photoUpload.value = '';

    // Reset color selection
    colorBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.color-btn[data-color="#FFFFFF"]').classList.add('active');
    selectedBackground = '#FFFFFF';

    trackEvent('reset', 'passport_photo', 'form_reset');
}

// Analytics helper
function trackEvent(action, category, label) {
    if (typeof gtag === 'function') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}
