// ============================================
// FAKE REDDIT POST GENERATOR - JAVASCRIPT
// ============================================

class RedditPostGenerator {
    constructor() {
        this.currentDevice = 'iphone';
        this.currentTheme = 'dark';
        this.currentPostType = 'text';
        this.uploadedImage = null;

        this.initializeElements();
        this.attachEventListeners();
        this.renderPreview();
    }

    initializeElements() {
        // Device buttons
        this.deviceButtons = document.querySelectorAll('.device-btn');

        // Theme buttons
        this.themeButtons = document.querySelectorAll('.theme-btn');

        // Post type buttons
        this.postTypeButtons = document.querySelectorAll('.post-type-btn');

        // Form inputs
        this.usernameInput = document.getElementById('username');
        this.subredditInput = document.getElementById('subreddit');
        this.postTitleInput = document.getElementById('post-title');
        this.postContentInput = document.getElementById('post-content');
        this.linkUrlInput = document.getElementById('link-url');
        this.upvotesInput = document.getElementById('upvotes');
        this.commentsInput = document.getElementById('comments');
        this.postTimeInput = document.getElementById('post-time');

        // Award checkboxes
        this.awardGold = document.getElementById('award-gold');
        this.awardSilver = document.getElementById('award-silver');
        this.awardWholesome = document.getElementById('award-wholesome');
        this.awardHelpful = document.getElementById('award-helpful');

        // Sections
        this.postContentSection = document.querySelector('.post-content-section');
        this.imageUploadSection = document.querySelector('.image-upload-section');
        this.linkUrlSection = document.querySelector('.link-url-section');

        // Image upload
        this.imageUploadArea = document.getElementById('image-upload-area');
        this.postImageInput = document.getElementById('post-image-input');
        this.uploadPlaceholder = document.getElementById('upload-placeholder');

        // Preview
        this.previewContainer = document.getElementById('reddit-post-preview');

        // Buttons
        this.resetBtn = document.getElementById('reset-btn');
        this.downloadBtn = document.getElementById('download-btn');
    }

    attachEventListeners() {
        // Device selection
        this.deviceButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleDeviceChange(btn));
        });

        // Theme selection
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleThemeChange(btn));
        });

        // Post type selection
        this.postTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handlePostTypeChange(btn));
        });

        // Form inputs - real-time update
        const inputs = [
            this.usernameInput,
            this.subredditInput,
            this.postTitleInput,
            this.postContentInput,
            this.linkUrlInput,
            this.upvotesInput,
            this.commentsInput,
            this.postTimeInput
        ];

        inputs.forEach(input => {
            input.addEventListener('input', () => this.renderPreview());
        });

        // Awards
        [this.awardGold, this.awardSilver, this.awardWholesome, this.awardHelpful].forEach(award => {
            award.addEventListener('change', () => this.renderPreview());
        });

        // Image upload
        this.imageUploadArea.addEventListener('click', () => {
            this.postImageInput.click();
        });

        this.postImageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Buttons
        this.resetBtn.addEventListener('click', () => this.resetForm());
        this.downloadBtn.addEventListener('click', () => this.downloadScreenshot());
    }

    handleDeviceChange(btn) {
        this.deviceButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentDevice = btn.dataset.device;
        this.renderPreview();
    }

    handleThemeChange(btn) {
        this.themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTheme = btn.dataset.theme;
        this.renderPreview();
    }

    handlePostTypeChange(btn) {
        this.postTypeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPostType = btn.dataset.type;

        // Show/hide relevant sections
        this.postContentSection.style.display = this.currentPostType === 'text' ? 'block' : 'none';
        this.imageUploadSection.style.display = this.currentPostType === 'image' ? 'block' : 'none';
        this.linkUrlSection.style.display = this.currentPostType === 'link' ? 'block' : 'none';

        this.renderPreview();
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.uploadedImage = event.target.result;
                this.updateUploadPreview();
                this.renderPreview();
            };
            reader.readAsDataURL(file);
        }
    }

    updateUploadPreview() {
        if (this.uploadedImage) {
            this.uploadPlaceholder.innerHTML = `
                <img src="${this.uploadedImage}" class="image-preview" alt="Uploaded image">
                <p style="margin-top: 12px; font-size: 0.875rem;">Click to change image</p>
            `;
        }
    }

    formatNumber(num) {
        num = parseInt(num) || 0;
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    getAwards() {
        const awards = [];
        if (this.awardGold.checked) awards.push({ icon: '🥇', name: 'Gold' });
        if (this.awardSilver.checked) awards.push({ icon: '🥈', name: 'Silver' });
        if (this.awardWholesome.checked) awards.push({ icon: '🤗', name: 'Wholesome' });
        if (this.awardHelpful.checked) awards.push({ icon: '💡', name: 'Helpful' });
        return awards;
    }

    renderPreview() {
        const username = this.usernameInput.value || 'u/username';
        const subreddit = this.subredditInput.value || 'r/subreddit';
        const title = this.postTitleInput.value || 'Post title';
        const content = this.postContentInput.value || '';
        const linkUrl = this.linkUrlInput.value || '';
        const upvotes = this.formatNumber(this.upvotesInput.value);
        const comments = this.formatNumber(this.commentsInput.value);
        const postTime = this.postTimeInput.value || '1h ago';
        const awards = this.getAwards();

        // Get first letter of username for avatar
        const avatarLetter = username.replace('u/', '').charAt(0).toUpperCase();

        // Build awards HTML
        let awardsHTML = '';
        if (awards.length > 0) {
            awardsHTML = '<div class="post-awards">';
            awards.forEach(award => {
                awardsHTML += `
                    <div class="award-badge">
                        <span>${award.icon}</span>
                        <span>${award.name}</span>
                    </div>
                `;
            });
            awardsHTML += '</div>';
        }

        // Build post content based on type
        let postBodyContent = '';

        if (this.currentPostType === 'text' && content) {
            postBodyContent = `<div class="post-content">${this.escapeHtml(content)}</div>`;
        } else if (this.currentPostType === 'image' && this.uploadedImage) {
            postBodyContent = `
                <div class="post-image-container">
                    <img src="${this.uploadedImage}" alt="Post image" class="post-image">
                </div>
            `;
        } else if (this.currentPostType === 'link' && linkUrl) {
            const domain = this.extractDomain(linkUrl);
            postBodyContent = `
                <a href="#" class="post-link" onclick="return false;">
                    <span>🔗</span>
                    <span>${domain}</span>
                </a>
            `;
        }

        // Build the complete Reddit post HTML
        const postHTML = `
            <div class="reddit-post theme-${this.currentTheme}">
                <div class="post-header">
                    <div class="post-avatar">${avatarLetter}</div>
                    <div class="post-info">
                        <div class="post-subreddit">${this.escapeHtml(subreddit)}</div>
                        <div class="post-meta">
                            <span class="post-username">${this.escapeHtml(username)}</span>
                            <span class="post-separator">•</span>
                            <span class="post-time">${this.escapeHtml(postTime)}</span>
                        </div>
                    </div>
                </div>
                <div class="post-body">
                    <div class="post-title">${this.escapeHtml(title)}</div>
                    ${postBodyContent}
                    ${awardsHTML}
                </div>
                <div class="post-actions">
                    <button class="action-btn vote-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2l-7 7h4v7h6v-7h4z"/>
                        </svg>
                        <span class="vote-count">${upvotes}</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 18l7-7h-4V4H7v7H3z"/>
                        </svg>
                    </button>
                    
                    <button class="action-btn comment-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2C5.58 2 2 5.13 2 9c0 1.92.99 3.64 2.56 4.85L3.5 17l3.56-1.06C8.03 16.62 8.99 17 10 17c4.42 0 8-3.13 8-7s-3.58-7-8-7zm0 12c-.83 0-1.62-.19-2.33-.52l-1.92.57.57-1.92C5.52 11.62 5 10.36 5 9c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5z"/>
                        </svg>
                        <span>${comments}</span>
                    </button>
                    
                    ${awards.length > 0 ? `
                    <button class="action-btn award-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 2l1.5 4.5h4.5l-3.5 2.5 1.5 4.5L10 11l-3.5 2.5 1.5-4.5-3.5-2.5h4.5z"/>
                        </svg>
                        <span>${awards.length}</span>
                    </button>
                    ` : ''}
                    
                    <button class="action-btn share-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3l5 5-5 5v-3H4v-4h8V3z"/>
                        </svg>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;

        // Update preview container with device class
        this.previewContainer.className = `reddit-post-preview device-${this.currentDevice}`;
        this.previewContainer.innerHTML = postHTML;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url;
        }
    }

    resetForm() {
        // Reset to default values
        this.usernameInput.value = 'u/throwaway123';
        this.subredditInput.value = 'r/AskReddit';
        this.postTitleInput.value = "What's the most interesting fact you know?";
        this.postContentInput.value = "I'll go first: Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still perfectly edible!";
        this.linkUrlInput.value = '';
        this.upvotesInput.value = '12500';
        this.commentsInput.value = '342';
        this.postTimeInput.value = '3h ago';

        // Reset awards
        this.awardGold.checked = false;
        this.awardSilver.checked = false;
        this.awardWholesome.checked = false;
        this.awardHelpful.checked = false;

        // Reset device and theme
        this.currentDevice = 'iphone';
        this.currentTheme = 'dark';
        this.currentPostType = 'text';

        // Reset uploaded image
        this.uploadedImage = null;
        this.postImageInput.value = '';
        this.uploadPlaceholder.innerHTML = `
            <span class="upload-icon">📸</span>
            <p>Click to upload image</p>
            <span class="upload-hint">PNG, JPG up to 10MB</span>
        `;

        // Reset button states
        this.deviceButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.device === 'iphone');
        });

        this.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === 'dark');
        });

        this.postTypeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'text');
        });

        // Show/hide sections
        this.postContentSection.style.display = 'block';
        this.imageUploadSection.style.display = 'none';
        this.linkUrlSection.style.display = 'none';

        // Re-render preview
        this.renderPreview();
    }

    async downloadScreenshot() {
        try {
            // Show loading state
            this.downloadBtn.innerHTML = '<span class="btn-icon">⏳</span>Generating...';
            this.downloadBtn.disabled = true;

            // Get the Reddit post element
            const redditPost = this.previewContainer.querySelector('.reddit-post');

            if (!redditPost) {
                throw new Error('No post to download');
            }

            // Use html2canvas to capture the element
            const canvas = await html2canvas(redditPost, {
                backgroundColor: this.currentTheme === 'dark' ? '#1A1A1B' : '#DAE0E6',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `reddit-post-${Date.now()}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);

                // Reset button state
                this.downloadBtn.innerHTML = '<span class="btn-icon">⬇️</span>Download Screenshot';
                this.downloadBtn.disabled = false;
            });

        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download screenshot. Please try again.');

            // Reset button state
            this.downloadBtn.innerHTML = '<span class="btn-icon">⬇️</span>Download Screenshot';
            this.downloadBtn.disabled = false;
        }
    }
}

// html2canvas library (inline for convenience)
// We'll load it from CDN in the HTML instead
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (window.html2canvas) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Load html2canvas library
    await loadHtml2Canvas();

    // Initialize the generator
    new RedditPostGenerator();
});
