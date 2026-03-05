// QR Code Generator - ImageNerd
let currentType = 'url';

// DOM Elements
const typeButtons = document.querySelectorAll('.qr-type-btn');
const generateBtn = document.getElementById('generateBtn');
const downloadPngBtn = document.getElementById('downloadPng');
const downloadSvgBtn = document.getElementById('downloadSvg');
const downloadButtons = document.getElementById('downloadButtons');
const qrCanvas = document.getElementById('qrCanvas');
const qrDisplay = document.getElementById('qrDisplay');
const previewPlaceholder = document.getElementById('previewPlaceholder');

const fgColor = document.getElementById('fgColor');
const bgColor = document.getElementById('bgColor');
const qrSize = document.getElementById('qrSize');
const errorCorrection = document.getElementById('errorCorrection');

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

    // Color inputs
    fgColor.addEventListener('input', updateColorValues);
    bgColor.addEventListener('input', updateColorValues);
}

function handleTypeSelect(btn) {
    typeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;

    // Show/hide content fields
    Object.keys(contentFields).forEach(type => {
        if (contentFields[type]) {
            contentFields[type].style.display = type === currentType ? 'block' : 'none';
        }
    });

    gtag('event', 'select_qr_type', { 'event_category': 'qr_code', 'event_label': currentType });
}

function updateColorValues() {
    document.getElementById('fgColorValue').textContent = fgColor.value.toUpperCase();
    document.getElementById('bgColorValue').textContent = bgColor.value.toUpperCase();
}

function getQRContent() {
    switch (currentType) {
        case 'url':
            return document.getElementById('urlInput').value.trim();

        case 'text':
            return document.getElementById('textInput').value.trim();

        case 'wifi':
            const ssid = document.getElementById('wifiSSID').value.trim();
            const password = document.getElementById('wifiPassword').value.trim();
            const encryption = document.getElementById('wifiEncryption').value;
            if (!ssid) return '';
            return `WIFI:T:${encryption};S:${ssid};P:${password};;`;

        case 'vcard':
            const name = document.getElementById('vcardName').value.trim();
            const phone = document.getElementById('vcardPhone').value.trim();
            const email = document.getElementById('vcardEmail').value.trim();
            if (!name) return '';

            let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
            vcard += `FN:${name}\n`;
            if (phone) vcard += `TEL:${phone}\n`;
            if (email) vcard += `EMAIL:${email}\n`;
            vcard += 'END:VCARD';
            return vcard;

        case 'email':
            const emailTo = document.getElementById('emailTo').value.trim();
            const subject = document.getElementById('emailSubject').value.trim();
            if (!emailTo) return '';

            let mailto = `mailto:${emailTo}`;
            if (subject) mailto += `?subject=${encodeURIComponent(subject)}`;
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
    generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';

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

        await QRCode.toCanvas(qrCanvas, content, options);

        previewPlaceholder.style.display = 'none';
        qrDisplay.style.display = 'block';
        downloadButtons.style.display = 'block';

        gtag('event', 'generate_qr', { 'event_category': 'qr_code', 'event_label': currentType });

    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Error generating QR code. Please try again.');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 8px;">
                <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h1A1.5 1.5 0 0 1 4 2.5v1A1.5 1.5 0 0 1 2.5 5h-1A1.5 1.5 0 0 1 0 3.5v-1zm8 0A1.5 1.5 0 0 1 9.5 1h1A1.5 1.5 0 0 1 12 2.5v1A1.5 1.5 0 0 1 10.5 5h-1A1.5 1.5 0 0 1 8 3.5v-1zm0 8A1.5 1.5 0 0 1 9.5 9h1a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 8 11.5v-1zM0 10.5A1.5 1.5 0 0 1 1.5 9h1a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 2.5 13h-1A1.5 1.5 0 0 1 0 11.5v-1z"/>
            </svg>
            Generate QR Code
        `;
    }
}

async function downloadQR(format) {
    const content = getQRContent();
    if (!content) return;

    const filename = `imagenerd-qr-code-${currentType}`;

    if (format === 'png') {
        // Use Blob-based download for reliable file extension handling
        qrCanvas.toBlob((blob) => {
            if (!blob) {
                alert('Error creating download. Please try again.');
                return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png');
    } else if (format === 'svg') {
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
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating SVG:', error);
            alert('Error generating SVG. Downloading as PNG instead.');
            downloadQR('png');
        }
    }

    gtag('event', 'download_qr', { 'event_category': 'qr_code', 'event_label': `${currentType}_${format}` });
}
