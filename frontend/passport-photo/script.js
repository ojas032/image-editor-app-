// Passport Photo Maker - ImageNerd
// Multi-language support + Passport Photo Generation

// ─── Country Specs ───
const countrySpecs = {
    'us': { width: 51, height: 51 },
    'uk': { width: 35, height: 45 },
    'in': { width: 51, height: 51 },
    'ca': { width: 50, height: 70 },
    'au': { width: 35, height: 45 },
    'schengen': { width: 35, height: 45 },
    'de': { width: 35, height: 45 },
    'fr': { width: 35, height: 45 },
    'it': { width: 35, height: 45 },
    'es': { width: 35, height: 45 },
    'cn': { width: 33, height: 48 },
    'jp': { width: 35, height: 45 },
    'kr': { width: 35, height: 45 }
};

// ─── Translations ───
const translations = {
    en: {
        pageTitle: 'Passport Photo Maker',
        pageSubtitle: 'Create perfect passport photos for 50+ countries. Free, fast & official compliant.',
        settings: 'Settings',
        selectCountry: 'Select Country',
        uploadPhoto: 'Upload Photo',
        dragDrop: 'Drag & drop your photo here',
        or: 'or',
        chooseFile: 'Choose File',
        supported: 'Supported: JPG, PNG, WebP. Max 10MB.',
        bgColor: 'Background Color',
        printLayout: 'Print Layout',
        singlePhoto: 'Single Photo',
        '4x6_4': '4x6 inch (4 photos)',
        '4x6_6': '4x6 inch (6 photos)',
        'a4_8': 'A4 Sheet (8 photos)',
        downloadPhoto: 'Download Photo',
        reset: 'Reset',
        changePhoto: 'Change Photo',
        preview: 'Preview',
        uploadAPhoto: 'Upload a Photo',
        previewHint: 'Your passport photo will appear here',
        proTip: 'Pro Tip:',
        proTipText: 'Use a photo with good lighting, neutral expression, and plain background for best results.',
        processing: 'Processing...',
        errorUpload: 'Please upload an image file',
        errorGenerate: 'Error generating photo. Please try again.',
        seoTitle: 'Create Passport Photos Online for Free',
        seoText: 'Generate professional passport photos that meet official government requirements. Our tool automatically applies the correct dimensions and guidelines for your selected country, making it easy to create compliant passport photos from home.',
        supportedCountries: 'Supported Countries',
        moreCountries: '+ 45 More Countries',
        officialDimensions: 'Official dimensions',
        faq: 'Frequently Asked Questions',
        faq1q: 'What size is a passport photo?',
        faq1a: 'Passport photo sizes vary by country. US passport photos are 2x2 inches (51x51mm), UK photos are 35x45mm, and Indian passport photos are 2x2 inches. Our tool automatically applies the correct dimensions.',
        faq2q: 'Is this passport photo maker free?',
        faq2a: 'Yes, our passport photo maker is completely free to use with no hidden charges or watermarks.',
        faq3q: 'Can I print passport photos at home?',
        faq3a: 'Yes! Our tool provides print-ready 4x6 inch templates with multiple passport photos that you can print at home or at any photo printing service.',
        // Country names
        popular: 'Popular',
        europe: 'Europe',
        asia: 'Asia',
        // Color titles
        white: 'White',
        offWhite: 'Off-white',
        lightBlue: 'Light Blue',
        red: 'Red'
    },
    hi: {
        pageTitle: 'पासपोर्ट फोटो मेकर',
        pageSubtitle: '50+ देशों के लिए सही पासपोर्ट फोटो बनाएं। मुफ्त, तेज़ और आधिकारिक अनुपालन।',
        settings: 'सेटिंग्स',
        selectCountry: 'देश चुनें',
        uploadPhoto: 'फोटो अपलोड करें',
        dragDrop: 'अपनी फोटो यहाँ ड्रैग और ड्रॉप करें',
        or: 'या',
        chooseFile: 'फ़ाइल चुनें',
        supported: 'समर्थित: JPG, PNG, WebP। अधिकतम 10MB।',
        bgColor: 'पृष्ठभूमि का रंग',
        printLayout: 'प्रिंट लेआउट',
        singlePhoto: 'एकल फोटो',
        '4x6_4': '4x6 इंच (4 फोटो)',
        '4x6_6': '4x6 इंच (6 फोटो)',
        'a4_8': 'A4 शीट (8 फोटो)',
        downloadPhoto: 'फोटो डाउनलोड करें',
        reset: 'रीसेट',
        changePhoto: 'फोटो बदलें',
        preview: 'पूर्वावलोकन',
        uploadAPhoto: 'एक फोटो अपलोड करें',
        previewHint: 'आपकी पासपोर्ट फोटो यहाँ दिखाई देगी',
        proTip: 'सुझाव:',
        proTipText: 'सर्वोत्तम परिणामों के लिए अच्छी रोशनी, तटस्थ अभिव्यक्ति और सादी पृष्ठभूमि वाली फोटो का उपयोग करें।',
        processing: 'प्रसंस्करण...',
        errorUpload: 'कृपया एक छवि फ़ाइल अपलोड करें',
        errorGenerate: 'फोटो बनाने में त्रुटि। कृपया पुनः प्रयास करें।',
        seoTitle: 'ऑनलाइन मुफ्त पासपोर्ट फोटो बनाएं',
        seoText: 'सरकारी आवश्यकताओं को पूरा करने वाली पेशेवर पासपोर्ट फोटो बनाएं। हमारा टूल आपके चुने हुए देश के लिए स्वचालित रूप से सही आयाम और दिशानिर्देश लागू करता है।',
        supportedCountries: 'समर्थित देश',
        moreCountries: '+ 45 और देश',
        officialDimensions: 'आधिकारिक आयाम',
        faq: 'अक्सर पूछे जाने वाले प्रश्न',
        faq1q: 'पासपोर्ट फोटो का आकार क्या है?',
        faq1a: 'पासपोर्ट फोटो का आकार देश के अनुसार भिन्न होता है। अमेरिकी पासपोर्ट फोटो 2x2 इंच (51x51mm), ब्रिटिश फोटो 35x45mm और भारतीय पासपोर्ट फोटो 2x2 इंच हैं।',
        faq2q: 'क्या यह पासपोर्ट फोटो मेकर मुफ्त है?',
        faq2a: 'हाँ, हमारा पासपोर्ट फोटो मेकर बिना किसी छिपे शुल्क या वॉटरमार्क के पूरी तरह मुफ्त है।',
        faq3q: 'क्या मैं घर पर पासपोर्ट फोटो प्रिंट कर सकता हूँ?',
        faq3a: 'हाँ! हमारा टूल प्रिंट-रेडी 4x6 इंच टेम्पलेट प्रदान करता है।',
        popular: 'लोकप्रिय',
        europe: 'यूरोप',
        asia: 'एशिया',
        white: 'सफेद',
        offWhite: 'हल्का सफेद',
        lightBlue: 'हल्का नीला',
        red: 'लाल'
    },
    es: {
        pageTitle: 'Creador de Fotos de Pasaporte',
        pageSubtitle: 'Crea fotos de pasaporte perfectas para más de 50 países. Gratis, rápido y oficialmente compatible.',
        settings: 'Configuración',
        selectCountry: 'Seleccionar País',
        uploadPhoto: 'Subir Foto',
        dragDrop: 'Arrastra y suelta tu foto aquí',
        or: 'o',
        chooseFile: 'Elegir Archivo',
        supported: 'Soportado: JPG, PNG, WebP. Máx 10MB.',
        bgColor: 'Color de Fondo',
        printLayout: 'Diseño de Impresión',
        singlePhoto: 'Foto Única',
        '4x6_4': '4x6 pulgadas (4 fotos)',
        '4x6_6': '4x6 pulgadas (6 fotos)',
        'a4_8': 'Hoja A4 (8 fotos)',
        downloadPhoto: 'Descargar Foto',
        reset: 'Restablecer',
        changePhoto: 'Cambiar Foto',
        preview: 'Vista Previa',
        uploadAPhoto: 'Sube una Foto',
        previewHint: 'Tu foto de pasaporte aparecerá aquí',
        proTip: 'Consejo:',
        proTipText: 'Usa una foto con buena iluminación, expresión neutra y fondo liso para mejores resultados.',
        processing: 'Procesando...',
        errorUpload: 'Por favor sube un archivo de imagen',
        errorGenerate: 'Error al generar la foto. Inténtalo de nuevo.',
        seoTitle: 'Crea Fotos de Pasaporte en Línea Gratis',
        seoText: 'Genera fotos de pasaporte profesionales que cumplen con los requisitos oficiales del gobierno. Nuestra herramienta aplica automáticamente las dimensiones correctas para tu país seleccionado.',
        supportedCountries: 'Países Soportados',
        moreCountries: '+ 45 Más Países',
        officialDimensions: 'Dimensiones oficiales',
        faq: 'Preguntas Frecuentes',
        faq1q: '¿Qué tamaño tiene una foto de pasaporte?',
        faq1a: 'Los tamaños de fotos de pasaporte varían por país. Las fotos de pasaporte de EE.UU. son de 2x2 pulgadas (51x51mm), las del Reino Unido son de 35x45mm.',
        faq2q: '¿Es gratis este creador de fotos de pasaporte?',
        faq2a: 'Sí, nuestro creador de fotos de pasaporte es completamente gratuito, sin cargos ocultos ni marcas de agua.',
        faq3q: '¿Puedo imprimir fotos de pasaporte en casa?',
        faq3a: '¡Sí! Nuestra herramienta proporciona plantillas listas para imprimir de 4x6 pulgadas con múltiples fotos de pasaporte.',
        popular: 'Popular',
        europe: 'Europa',
        asia: 'Asia',
        white: 'Blanco',
        offWhite: 'Blanco hueso',
        lightBlue: 'Azul claro',
        red: 'Rojo'
    },
    fr: {
        pageTitle: 'Créateur de Photos de Passeport',
        pageSubtitle: 'Créez des photos de passeport parfaites pour plus de 50 pays. Gratuit, rapide et conforme.',
        settings: 'Paramètres',
        selectCountry: 'Sélectionner le Pays',
        uploadPhoto: 'Télécharger une Photo',
        dragDrop: 'Glissez-déposez votre photo ici',
        or: 'ou',
        chooseFile: 'Choisir un Fichier',
        supported: 'Supporté : JPG, PNG, WebP. Max 10 Mo.',
        bgColor: 'Couleur de Fond',
        printLayout: 'Mise en Page d\'Impression',
        singlePhoto: 'Photo Unique',
        '4x6_4': '4x6 pouces (4 photos)',
        '4x6_6': '4x6 pouces (6 photos)',
        'a4_8': 'Feuille A4 (8 photos)',
        downloadPhoto: 'Télécharger la Photo',
        reset: 'Réinitialiser',
        changePhoto: 'Changer la Photo',
        preview: 'Aperçu',
        uploadAPhoto: 'Téléchargez une Photo',
        previewHint: 'Votre photo de passeport apparaîtra ici',
        proTip: 'Astuce :',
        proTipText: 'Utilisez une photo avec un bon éclairage, une expression neutre et un fond uni pour de meilleurs résultats.',
        processing: 'Traitement...',
        errorUpload: 'Veuillez télécharger un fichier image',
        errorGenerate: 'Erreur lors de la génération de la photo. Veuillez réessayer.',
        seoTitle: 'Créez des Photos de Passeport en Ligne Gratuitement',
        seoText: 'Générez des photos de passeport professionnelles conformes aux exigences officielles du gouvernement.',
        supportedCountries: 'Pays Supportés',
        moreCountries: '+ 45 Pays Supplémentaires',
        officialDimensions: 'Dimensions officielles',
        faq: 'Questions Fréquemment Posées',
        faq1q: 'Quelle est la taille d\'une photo de passeport ?',
        faq1a: 'Les tailles de photos de passeport varient selon le pays. Les photos de passeport américaines mesurent 2x2 pouces (51x51mm), les britanniques 35x45mm.',
        faq2q: 'Ce créateur de photos de passeport est-il gratuit ?',
        faq2a: 'Oui, notre créateur de photos de passeport est entièrement gratuit, sans frais cachés ni filigrane.',
        faq3q: 'Puis-je imprimer des photos de passeport à la maison ?',
        faq3a: 'Oui ! Notre outil fournit des modèles prêts à imprimer de 4x6 pouces avec plusieurs photos de passeport.',
        popular: 'Populaire',
        europe: 'Europe',
        asia: 'Asie',
        white: 'Blanc',
        offWhite: 'Blanc cassé',
        lightBlue: 'Bleu clair',
        red: 'Rouge'
    },
    de: {
        pageTitle: 'Passfoto-Ersteller',
        pageSubtitle: 'Erstellen Sie perfekte Passfotos für über 50 Länder. Kostenlos, schnell und offiziell konform.',
        settings: 'Einstellungen',
        selectCountry: 'Land Auswählen',
        uploadPhoto: 'Foto Hochladen',
        dragDrop: 'Foto hierher ziehen und ablegen',
        or: 'oder',
        chooseFile: 'Datei Auswählen',
        supported: 'Unterstützt: JPG, PNG, WebP. Max 10MB.',
        bgColor: 'Hintergrundfarbe',
        printLayout: 'Drucklayout',
        singlePhoto: 'Einzelfoto',
        '4x6_4': '4x6 Zoll (4 Fotos)',
        '4x6_6': '4x6 Zoll (6 Fotos)',
        'a4_8': 'A4-Blatt (8 Fotos)',
        downloadPhoto: 'Foto Herunterladen',
        reset: 'Zurücksetzen',
        changePhoto: 'Foto Ändern',
        preview: 'Vorschau',
        uploadAPhoto: 'Foto Hochladen',
        previewHint: 'Ihr Passfoto wird hier angezeigt',
        proTip: 'Tipp:',
        proTipText: 'Verwenden Sie ein Foto mit guter Beleuchtung, neutralem Ausdruck und einfarbigem Hintergrund.',
        processing: 'Verarbeitung...',
        errorUpload: 'Bitte laden Sie eine Bilddatei hoch',
        errorGenerate: 'Fehler beim Generieren des Fotos. Bitte versuchen Sie es erneut.',
        seoTitle: 'Passfotos Online Kostenlos Erstellen',
        seoText: 'Generieren Sie professionelle Passfotos, die den offiziellen Anforderungen der Regierung entsprechen.',
        supportedCountries: 'Unterstützte Länder',
        moreCountries: '+ 45 Weitere Länder',
        officialDimensions: 'Offizielle Maße',
        faq: 'Häufig Gestellte Fragen',
        faq1q: 'Welche Größe hat ein Passfoto?',
        faq1a: 'Passfoto-Größen variieren je nach Land. US-Passfotos sind 2x2 Zoll (51x51mm), britische Fotos 35x45mm.',
        faq2q: 'Ist dieser Passfoto-Ersteller kostenlos?',
        faq2a: 'Ja, unser Passfoto-Ersteller ist völlig kostenlos, ohne versteckte Gebühren oder Wasserzeichen.',
        faq3q: 'Kann ich Passfotos zu Hause drucken?',
        faq3a: 'Ja! Unser Tool bietet druckfertige 4x6-Zoll-Vorlagen mit mehreren Passfotos.',
        popular: 'Beliebt',
        europe: 'Europa',
        asia: 'Asien',
        white: 'Weiß',
        offWhite: 'Cremeweiß',
        lightBlue: 'Hellblau',
        red: 'Rot'
    },
    ja: {
        pageTitle: 'パスポート写真メーカー',
        pageSubtitle: '50ヶ国以上対応のパスポート写真を作成。無料・高速・公式準拠。',
        settings: '設定',
        selectCountry: '国を選択',
        uploadPhoto: '写真をアップロード',
        dragDrop: 'ここに写真をドラッグ＆ドロップ',
        or: 'または',
        chooseFile: 'ファイルを選択',
        supported: '対応: JPG, PNG, WebP。最大10MB。',
        bgColor: '背景色',
        printLayout: '印刷レイアウト',
        singlePhoto: '単一写真',
        '4x6_4': '4x6インチ（4枚）',
        '4x6_6': '4x6インチ（6枚）',
        'a4_8': 'A4シート（8枚）',
        downloadPhoto: '写真をダウンロード',
        reset: 'リセット',
        changePhoto: '写真を変更',
        preview: 'プレビュー',
        uploadAPhoto: '写真をアップロード',
        previewHint: 'パスポート写真がここに表示されます',
        proTip: 'ヒント：',
        proTipText: '良い照明、自然な表情、無地の背景で最良の結果が得られます。',
        processing: '処理中...',
        errorUpload: '画像ファイルをアップロードしてください',
        errorGenerate: '写真の生成中にエラーが発生しました。もう一度お試しください。',
        seoTitle: 'オンラインで無料パスポート写真を作成',
        seoText: '政府の公式要件を満たすプロのパスポート写真を生成します。',
        supportedCountries: '対応国',
        moreCountries: '+ 45ヶ国以上',
        officialDimensions: '公式サイズ',
        faq: 'よくある質問',
        faq1q: 'パスポート写真のサイズは？',
        faq1a: 'パスポート写真のサイズは国によって異なります。米国は2x2インチ（51x51mm）、英国は35x45mmです。',
        faq2q: 'このパスポート写真メーカーは無料ですか？',
        faq2a: 'はい、隠れた料金やウォーターマークなしで完全無料です。',
        faq3q: '自宅でパスポート写真を印刷できますか？',
        faq3a: 'はい！印刷対応の4x6インチテンプレートを提供しています。',
        popular: '人気',
        europe: 'ヨーロッパ',
        asia: 'アジア',
        white: '白',
        offWhite: 'オフホワイト',
        lightBlue: '水色',
        red: '赤'
    },
    zh: {
        pageTitle: '护照照片制作器',
        pageSubtitle: '为50多个国家制作完美的护照照片。免费、快速且符合官方标准。',
        settings: '设置',
        selectCountry: '选择国家',
        uploadPhoto: '上传照片',
        dragDrop: '将照片拖放到此处',
        or: '或',
        chooseFile: '选择文件',
        supported: '支持：JPG、PNG、WebP。最大10MB。',
        bgColor: '背景颜色',
        printLayout: '打印布局',
        singlePhoto: '单张照片',
        '4x6_4': '4x6英寸（4张照片）',
        '4x6_6': '4x6英寸（6张照片）',
        'a4_8': 'A4纸（8张照片）',
        downloadPhoto: '下载照片',
        reset: '重置',
        changePhoto: '更换照片',
        preview: '预览',
        uploadAPhoto: '上传照片',
        previewHint: '您的护照照片将显示在此处',
        proTip: '提示：',
        proTipText: '使用光线良好、表情自然、背景简单的照片以获得最佳效果。',
        processing: '处理中...',
        errorUpload: '请上传图片文件',
        errorGenerate: '生成照片时出错。请重试。',
        seoTitle: '免费在线制作护照照片',
        seoText: '生成符合政府官方要求的专业护照照片。我们的工具会自动应用您所选国家的正确尺寸和准则。',
        supportedCountries: '支持的国家',
        moreCountries: '+ 45个更多国家',
        officialDimensions: '官方尺寸',
        faq: '常见问题',
        faq1q: '护照照片的尺寸是多少？',
        faq1a: '护照照片大小因国家而异。美国护照照片为2x2英寸（51x51mm），英国为35x45mm。',
        faq2q: '这个护照照片制作器免费吗？',
        faq2a: '是的，我们的护照照片制作器完全免费，没有隐藏费用或水印。',
        faq3q: '我可以在家打印护照照片吗？',
        faq3a: '可以！我们的工具提供可打印的4x6英寸模板，包含多张护照照片。',
        popular: '热门',
        europe: '欧洲',
        asia: '亚洲',
        white: '白色',
        offWhite: '灰白色',
        lightBlue: '浅蓝色',
        red: '红色'
    }
};

let currentLang = 'en';
let currentImage = null;
let selectedBackground = '#FFFFFF';
let currentSpecs = countrySpecs['in'];

const photoUpload = document.getElementById('photoUpload');
const previewCanvas = document.getElementById('previewCanvas');
const photoEditor = document.getElementById('photoEditor');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const countrySelect = document.getElementById('country');
const printLayout = document.getElementById('printLayout');
const bgColorBtns = document.querySelectorAll('.bg-color-btn');
const uploadArea = document.querySelector('.upload-area');

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateSizeInfo();
    detectLanguage();
});

// ─── Language Detection ───
function detectLanguage() {
    const saved = localStorage.getItem('passport_photo_lang');
    if (saved && translations[saved]) {
        setLanguage(saved);
    } else {
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            setLanguage(browserLang);
        }
    }
    // Update the language selector
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = currentLang;
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('passport_photo_lang', lang);

    const t = translations[lang];

    // Update all translatable elements
    const els = document.querySelectorAll('[data-i18n]');
    els.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Update placeholders and titles
    const titleEls = document.querySelectorAll('[data-i18n-title]');
    titleEls.forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (t[key]) el.title = t[key];
    });

    // Update select options
    const printSelect = document.getElementById('printLayout');
    if (printSelect) {
        printSelect.options[0].textContent = t.singlePhoto;
        printSelect.options[1].textContent = t['4x6_4'];
        printSelect.options[2].textContent = t['4x6_6'];
        printSelect.options[3].textContent = t['a4_8'];
    }

    // Update optgroup labels
    const optgroups = countrySelect.querySelectorAll('optgroup');
    if (optgroups[0]) optgroups[0].label = t.popular;
    if (optgroups[1]) optgroups[1].label = t.europe;
    if (optgroups[2]) optgroups[2].label = t.asia;

    // Update the lang selector
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    // Update page title for SEO
    document.documentElement.lang = lang;
}

function t(key) {
    return translations[currentLang]?.[key] || translations.en[key] || key;
}

// ─── Event Listeners ───
function setupEventListeners() {
    photoUpload.addEventListener('change', handleFileSelect);

    // Upload area click
    uploadArea.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
            photoUpload.click();
        }
    });

    // Drag & drop support
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            photoUpload.files = e.dataTransfer.files;
            handleFileSelect({ target: { files: files } });
        }
    });

    // Country selection
    countrySelect.addEventListener('change', () => {
        currentSpecs = countrySpecs[countrySelect.value];
        updateSizeInfo();
        if (currentImage) renderPhoto();
    });

    // Background color buttons
    bgColorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bgColorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedBackground = btn.dataset.color;
            if (currentImage) renderPhoto();
        });
    });

    downloadBtn.addEventListener('click', downloadPhoto);
    resetBtn.addEventListener('click', resetForm);

    // Language selector
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            setLanguage(langSelect.value);
        });
    }

    // Change photo button
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            photoUpload.click();
        });
    }
}

function updateSizeInfo() {
    const info = document.getElementById('sizeInfo');
    info.textContent = `${currentSpecs.width} x ${currentSpecs.height} mm • 300 DPI`;
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert(t('errorUpload'));
        return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            renderPhoto();
            previewPlaceholder.style.display = 'none';
            photoEditor.style.display = 'block';
            downloadBtn.disabled = false;

            // Show change photo button
            const changePhotoBtn = document.getElementById('changePhotoBtn');
            if (changePhotoBtn) changePhotoBtn.style.display = 'inline-block';

            try {
                gtag('event', 'upload_photo', { 'event_category': 'passport_photo' });
            } catch (e) { }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function renderPhoto() {
    if (!currentImage) return;

    const dpi = 300;
    const widthPx = Math.round((currentSpecs.width / 25.4) * dpi);
    const heightPx = Math.round((currentSpecs.height / 25.4) * dpi);

    previewCanvas.width = widthPx;
    previewCanvas.height = heightPx;
    const ctx = previewCanvas.getContext('2d');

    // Fill background
    ctx.fillStyle = selectedBackground;
    ctx.fillRect(0, 0, widthPx, heightPx);

    // Calculate image scaling (cover mode - fills entire canvas)
    const imgRatio = currentImage.width / currentImage.height;
    const canvasRatio = widthPx / heightPx;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > canvasRatio) {
        drawHeight = heightPx;
        drawWidth = drawHeight * imgRatio;
        drawX = (widthPx - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = widthPx;
        drawHeight = drawWidth / imgRatio;
        drawX = 0;
        drawY = (heightPx - drawHeight) / 2;
    }

    ctx.drawImage(currentImage, drawX, drawY, drawWidth, drawHeight);

    // Draw a thin border in the selected background color around the canvas preview
    // This helps indicate the background color to the user
    const borderSize = Math.max(6, Math.round(widthPx * 0.012));
    ctx.strokeStyle = selectedBackground;
    ctx.lineWidth = borderSize * 2;
    ctx.strokeRect(0, 0, widthPx, heightPx);
}

async function downloadPhoto() {
    if (!currentImage) return;

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>' + t('processing');

    try {
        const layout = printLayout.value;
        let finalCanvas = previewCanvas;

        if (layout !== 'single') {
            finalCanvas = generatePrintLayout(layout);
        }

        const link = document.createElement('a');
        link.download = `passport-photo-${currentSpecs.width}x${currentSpecs.height}mm.jpg`;
        link.href = finalCanvas.toDataURL('image/jpeg', 0.95);
        link.click();

        try {
            gtag('event', 'download_photo', { 'event_category': 'passport_photo', 'event_label': layout });
        } catch (e) { }
    } catch (error) {
        console.error('Error generating photo:', error);
        alert(t('errorGenerate'));
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 8px;">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            ${t('downloadPhoto')}
        `;
    }
}

function generatePrintLayout(layout) {
    let cols, rows, paperWidth, paperHeight;

    switch (layout) {
        case '4x6-4':
            cols = 2;
            rows = 2;
            paperWidth = 1800;
            paperHeight = 1200;
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
            paperWidth = 2480;
            paperHeight = 3508;
            break;
        default:
            return previewCanvas;
    }

    const layoutCanvas = document.createElement('canvas');
    layoutCanvas.width = paperWidth;
    layoutCanvas.height = paperHeight;
    const ctx = layoutCanvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paperWidth, paperHeight);

    const photoWidth = previewCanvas.width;
    const photoHeight = previewCanvas.height;
    const gapX = (paperWidth - (cols * photoWidth)) / (cols + 1);
    const gapY = (paperHeight - (rows * photoHeight)) / (rows + 1);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = gapX + col * (photoWidth + gapX);
            const y = gapY + row * (photoHeight + gapY);
            ctx.drawImage(previewCanvas, x, y);
        }
    }

    return layoutCanvas;
}

function resetForm() {
    currentImage = null;
    photoUpload.value = '';
    previewPlaceholder.style.display = 'block';
    photoEditor.style.display = 'none';
    downloadBtn.disabled = true;

    // Hide change photo button
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    if (changePhotoBtn) changePhotoBtn.style.display = 'none';

    bgColorBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.bg-color-btn[data-color="#FFFFFF"]').classList.add('active');
    selectedBackground = '#FFFFFF';

    try {
        gtag('event', 'reset', { 'event_category': 'passport_photo' });
    } catch (e) { }
}
