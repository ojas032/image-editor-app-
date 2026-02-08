/**
 * QR Code Generator - ImageNerd
 * Free online QR code generator with customization
 */

// State
let currentType = 'url';
let logoImage = null;

// DOM Elements
const typeButtons = document.querySelectorAll('.type-btn');
const generateBtn = document.getElementById('generateBtn');
const downloadPngBtn = document.getElementById('downloadPng');
const downloadSvgBtn = document.getElementById('downloadSvg');
const downloadButtons = document.getElementById('downloadButtons');
const qrCanvas = document.getElementById('qrCanvas');
const qrDisplay = document.getElementById('qrDisplay');
const previewPlaceholder = document.getElementById('previewPlaceholder');

// Input Elements
const urlInput = document.getElementById('urlInput');
const textInput = document.getElementById('textInput');
const qrSize = document.getElementById('qrSize');
const fgColor = document.getElementById('fgColor');
const bgColor = document.getElementById('bgColor');
const errorCorrection = document.getElementById('errorCorrection');
const logoUploadArea = document.getElementById('logoUploadArea');
const logoUpload = document.getElementById('logoUpload');
const logoPreview = document.getElementById('logoPreview');
const logoImg = document.getElementById('logoImg');
const removeLogo = document.getElementById('removeLogo');

// Content field groups
const contentFields = {
    url: document.getElementById('urlFields'),
    text: document.getElementById('textFields'),
    wifi: document.getElementById('wifiFields'),
    vcard: document.getElementById('vcardFields'),
    email: document.getElementById('emailFields'),
    phone: document.getElementById('phoneFields'),
    sms: document.getElementById('smsFields'),
    location: document.getElementById('locationFields')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateColorValues();
});

function setupEventListeners() {
    // Type selection
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => handleTypeSelect(btn));
    });

    // Generate button
    generateBtn.addEventListener('click', generateQRCode);

    // Download buttons
    downloadPngBtn.addEventListener('click', () => downloadQR('png'));
    downloadSvgBtn.addEventListener('click', () => downloadQR('svg'));

    // Color inputs - update display value
    fgColor.addEventListener('input', updateColorValues);
    bgColor.addEventListener('input', updateColorValues);

    // Logo upload
    logoUploadArea.addEventListener('click', () => logoUpload.click());
    logoUpload.addEventListener('change', handleLogoUpload);
    removeLogo.addEventListener('click', handleRemoveLogo);

    // Generate on Enter key for URL input
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateQRCode();
    });

    // Auto-generate on input change (debounced)
    let debounceTimer;
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (hasValidContent()) {
                    generateQRCode();
                }
            }, 500);
        });
    });
}

function handleTypeSelect(btn) {
    // Update active state
    typeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Get type
    currentType = btn.dataset.type;

    // Show/hide content fields
    Object.keys(contentFields).forEach(type => {
        if (contentFields[type]) {
            contentFields[type].style.display = type === currentType ? 'block' : 'none';
        }
    });

    // Track event
    trackEvent('select_type', 'qr_code', currentType);
}

function updateColorValues() {
    const fgWrapper = fgColor.closest('.color-input-wrapper');
    const bgWrapper = bgColor.closest('.color-input-wrapper');

    if (fgWrapper) {
        fgWrapper.querySelector('.color-value').textContent = fgColor.value.toUpperCase();
    }
    if (bgWrapper) {
        bgWrapper.querySelector('.color-value').textContent = bgColor.value.toUpperCase();
    }
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            logoImage = img;
            logoImg.src = event.target.result;
            logoUploadArea.style.display = 'none';
            logoPreview.style.display = 'flex';
            trackEvent('upload_logo', 'qr_code', 'logo_added');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleRemoveLogo() {
    logoImage = null;
    logoUpload.value = '';
    logoUploadArea.style.display = 'block';
    logoPreview.style.display = 'none';
}

function hasValidContent() {
    const content = getQRContent();
    return content && content.trim().length > 0;
}

function getQRContent() {
    switch (currentType) {
        case 'url':
            return urlInput.value.trim();

        case 'text':
            return textInput.value.trim();

        case 'wifi':
            const ssid = document.getElementById('wifiSSID').value.trim();
            const password = document.getElementById('wifiPassword').value.trim();
            const encryption = document.getElementById('wifiEncryption').value;
            const hidden = document.getElementById('wifiHidden').checked;

            if (!ssid) return '';
            return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;

        case 'vcard':
            const name = document.getElementById('vcardName').value.trim();
            const phone = document.getElementById('vcardPhone').value.trim();
            const email = document.getElementById('vcardEmail').value.trim();
            const org = document.getElementById('vcardOrg').value.trim();
            const url = document.getElementById('vcardUrl').value.trim();

            if (!name) return '';

            let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
            vcard += `FN:${name}\n`;
            if (phone) vcard += `TEL:${phone}\n`;
            if (email) vcard += `EMAIL:${email}\n`;
            if (org) vcard += `ORG:${org}\n`;
            if (url) vcard += `URL:${url}\n`;
            vcard += 'END:VCARD';
            return vcard;

        case 'email':
            const emailTo = document.getElementById('emailTo').value.trim();
            const subject = document.getElementById('emailSubject').value.trim();
            const body = document.getElementById('emailBody').value.trim();

            if (!emailTo) return '';

            let mailto = `mailto:${emailTo}`;
            const params = [];
            if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
            if (body) params.push(`body=${encodeURIComponent(body)}`);
            if (params.length > 0) mailto += '?' + params.join('&');
            return mailto;

        case 'phone':
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            return phoneNumber ? `tel:${phoneNumber}` : '';

        case 'sms':
            const smsNumber = document.getElementById('smsNumber').value.trim();
            const smsMessage = document.getElementById('smsMessage').value.trim();

            if (!smsNumber) return '';

            let sms = `sms:${smsNumber}`;
            if (smsMessage) sms += `?body=${encodeURIComponent(smsMessage)}`;
            return sms;

        case 'location':
            const lat = document.getElementById('locationLat').value.trim();
            const lng = document.getElementById('locationLng').value.trim();

            if (!lat || !lng) return '';
            return `geo:${lat},${lng}`;

        default:
            return '';
    }
}

async function generateQRCode() {
    const content = getQRContent();

    if (!content) {
        alert('Please enter content for the QR code');
        return;
    }

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading">Generating...</span>';

    try {
        const size = parseInt(qrSize.value);
        const options = {
            width: size,
            height: size,
            color: {
                dark: fgColor.value,
                light: bgColor.value
            },
            errorCorrectionLevel: errorCorrection.value,
            margin: 2
        };

        // Generate QR code to canvas
        await QRCode.toCanvas(qrCanvas, content, options);

        // Add logo if present
        if (logoImage) {
            addLogoToQR(qrCanvas, logoImage, size);
        }

        // Show the QR code
        previewPlaceholder.style.display = 'none';
        qrDisplay.style.display = 'block';
        downloadButtons.style.display = 'flex';

        // Track event
        trackEvent('generate_qr', 'qr_code', currentType);

    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code. Please try again.');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm8-2h7v7h-7V3zm2 2v3h3V5h-3zM3 13h7v7H3v-7zm2 2v3h3v-3H5z"/>
            </svg>
            Generate QR Code
        `;
    }
}

function addLogoToQR(canvas, logo, size) {
    const ctx = canvas.getContext('2d');

    // Calculate logo size (15-20% of QR code)
    const logoSize = size * 0.2;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;

    // Draw white background behind logo
    const padding = 5;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2);

    // Draw logo
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
}

async function downloadQR(format) {
    const content = getQRContent();
    if (!content) return;

    const timestamp = Date.now();
    const filename = `qr-code-${currentType}-${timestamp}`;

    if (format === 'png') {
        // Download as PNG
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = qrCanvas.toDataURL('image/png');
        link.click();
    } else if (format === 'svg') {
        // Generate SVG
        try {
            const size = parseInt(qrSize.value);
            const svgString = await QRCode.toString(content, {
                type: 'svg',
                width: size,
                height: size,
                color: {
                    dark: fgColor.value,
                    light: bgColor.value
                },
                errorCorrectionLevel: errorCorrection.value,
                margin: 2
            });

            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${filename}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating SVG:', error);
            alert('Error generating SVG. Downloading as PNG instead.');
            downloadQR('png');
        }
    }

    trackEvent('download_qr', 'qr_code', `${currentType}_${format}`);
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
