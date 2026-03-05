// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Get current date and time
    const now = new Date();
    const timeInput = document.getElementById('tweetTime');
    const dateInput = document.getElementById('tweetDate');

    // Set default time to current time
    timeInput.value = now.toTimeString().slice(0, 5);
    dateInput.value = now.toISOString().slice(0, 10);

    // Add event listeners
    addEventListeners();

    // Initial render
    updateCharCount();
    renderTweet();
}

function addEventListeners() {
    // Form inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'file') {
            input.addEventListener('change', handleFileUpload);
        } else if (input.tagName === 'SELECT') {
            input.addEventListener('change', renderTweet);
            input.addEventListener('input', renderTweet);
        } else {
            input.addEventListener('input', renderTweet);
        }
    });

    // Character count for tweet text
    const tweetText = document.getElementById('tweetText');
    tweetText.addEventListener('input', updateCharCount);

    // Theme toggle
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            themeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTweet();
        });
    });

    // Action buttons
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    document.getElementById('downloadBtn').addEventListener('click', downloadTweet);
}

function updateCharCount() {
    const tweetText = document.getElementById('tweetText');
    const charCount = document.getElementById('charCount');
    const length = tweetText.value.length;

    charCount.textContent = length;
    charCount.parentElement.classList.remove('warning', 'error');

    if (length > 240 && length <= 280) {
        charCount.parentElement.classList.add('warning');
    } else if (length > 280) {
        charCount.parentElement.classList.add('error');
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        if (e.target.id === 'profileImageUpload') {
            document.getElementById('profileImage').value = event.target.result;
        } else if (e.target.id === 'tweetImageUpload') {
            document.getElementById('tweetImage').value = event.target.result;
        }
        renderTweet();
    };
    reader.readAsDataURL(file);
}

function renderTweet() {
    const preview = document.getElementById('tweetPreview');
    const isDark = document.querySelector('.theme-btn.active').dataset.theme === 'dark';

    // Get form values
    const displayName = document.getElementById('displayName').value || 'Display Name';
    const username = document.getElementById('username').value || 'username';
    const profileImage = document.getElementById('profileImage').value || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const verified = document.getElementById('verified').checked;
    const tweetText = document.getElementById('tweetText').value || 'Your tweet text will appear here...';
    const tweetImage = document.getElementById('tweetImage').value;
    const retweets = formatNumber(document.getElementById('retweets').value || 0);
    const quotes = formatNumber(document.getElementById('quotes').value || 0);
    const likes = formatNumber(document.getElementById('likes').value || 0);
    const bookmarks = formatNumber(document.getElementById('bookmarks').value || 0);
    const time = document.getElementById('tweetTime').value;
    const date = document.getElementById('tweetDate').value;
    const source = document.getElementById('tweetSource').value;

    // Format date and time
    const formattedDateTime = formatDateTime(time, date);

    // Build tweet HTML
    let html = `
        <div class="tweet-header">
            <img src="${escapeHtml(profileImage)}" alt="${escapeHtml(displayName)}" class="tweet-avatar" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'">
            <div class="tweet-user-info">
                <div class="tweet-user-name">
                    <span class="tweet-display-name">${escapeHtml(displayName)}</span>
                    ${verified ? `
                        <svg class="verified-badge" viewBox="0 0 22 22" aria-label="Verified account">
                            <g>
                                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"></path>
                            </g>
                        </svg>
                    ` : ''}
                    <span class="tweet-username">@${escapeHtml(username)}</span>
                </div>
            </div>
        </div>
        
        <div class="tweet-content">
            <p class="tweet-text">${escapeHtml(tweetText)}</p>
            ${tweetImage ? `
                <div class="tweet-image-container">
                    <img src="${escapeHtml(tweetImage)}" alt="Tweet image" class="tweet-image" onerror="this.style.display='none'">
                </div>
            ` : ''}
        </div>
        
        <div class="tweet-metadata">
            <span class="tweet-time">${formattedDateTime} · ${escapeHtml(source)}</span>
        </div>
        
        <div class="tweet-stats">
            <div class="tweet-stat">
                <span class="tweet-stat-value">${retweets}</span>
                <span class="tweet-stat-label">Retweets</span>
            </div>
            <div class="tweet-stat">
                <span class="tweet-stat-value">${quotes}</span>
                <span class="tweet-stat-label">Quotes</span>
            </div>
            <div class="tweet-stat">
                <span class="tweet-stat-value">${likes}</span>
                <span class="tweet-stat-label">Likes</span>
            </div>
            <div class="tweet-stat">
                <span class="tweet-stat-value">${bookmarks}</span>
                <span class="tweet-stat-label">Bookmarks</span>
            </div>
        </div>
        
        <div class="tweet-actions">
            <div class="tweet-action">
                <svg viewBox="0 0 24 24">
                    <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                </svg>
            </div>
            <div class="tweet-action">
                <svg viewBox="0 0 24 24">
                    <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
                </svg>
            </div>
            <div class="tweet-action">
                <svg viewBox="0 0 24 24">
                    <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                </svg>
            </div>
            <div class="tweet-action">
                <svg viewBox="0 0 24 24">
                    <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path>
                </svg>
            </div>
        </div>
    `;

    preview.innerHTML = html;
    preview.className = `tweet-preview ${isDark ? 'dark' : ''}`;
}

function formatNumber(num) {
    num = parseInt(num) || 0;
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

function formatDateTime(time, date) {
    if (!time || !date) return '';

    const dateObj = new Date(date + 'T' + time);
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();

    return `${displayHours}:${displayMinutes} ${ampm} · ${month} ${day}, ${year}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function resetForm() {
    // Reset to default values
    document.getElementById('displayName').value = 'Elon Musk';
    document.getElementById('username').value = 'elonmusk';
    document.getElementById('profileImage').value = 'https://pbs.twimg.com/profile_images/1815749056821346304/jS8I28PL_400x400.jpg';
    document.getElementById('verified').checked = true;
    document.getElementById('tweetText').value = "Just had a great conversation about the future of AI and sustainable energy! 🚀";
    document.getElementById('tweetImage').value = '';
    document.getElementById('retweets').value = '1234';
    document.getElementById('quotes').value = '567';
    document.getElementById('likes').value = '8901';
    document.getElementById('bookmarks').value = '234';

    const now = new Date();
    document.getElementById('tweetTime').value = now.toTimeString().slice(0, 5);
    document.getElementById('tweetDate').value = now.toISOString().slice(0, 10);
    document.getElementById('tweetSource').value = 'Twitter Web App';

    // Clear file inputs
    document.getElementById('profileImageUpload').value = '';
    document.getElementById('tweetImageUpload').value = '';

    // Re-render
    updateCharCount();
    renderTweet();

    // Track reset event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'reset_form', {
            'event_category': 'engagement',
            'event_label': 'Reset Tweet Form'
        });
    }
}

async function downloadTweet() {
    const button = document.getElementById('downloadBtn');
    const originalHTML = button.innerHTML;

    // Show loading state
    button.innerHTML = '<span class="loading"></span> Generating...';
    button.disabled = true;

    try {
        const tweetElement = document.getElementById('tweetPreview');

        // Use html2canvas to capture the tweet
        const canvas = await html2canvas(tweetElement, {
            backgroundColor: null,
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        // Convert to blob and download
        canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().getTime();
            link.download = `tweet-${timestamp}.jpg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            // Reset button
            button.innerHTML = originalHTML;
            button.disabled = false;

            // Track download event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download_tweet', {
                    'event_category': 'engagement',
                    'event_label': 'Download Tweet Image'
                });
            }
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error generating image:', error);
        alert('Error generating image. Please try again.');
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
}

// Track page view
if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
        'page_title': 'Fake Twitter Tweet Generator',
        'page_location': window.location.href,
        'page_path': window.location.pathname
    });
}
