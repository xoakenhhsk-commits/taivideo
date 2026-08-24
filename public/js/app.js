/**
 * Main Application Logic for OmniFetch Studio
 */

const App = {
  selectedPlatform: 'all',

  init() {
    this.bindEvents();
    this.fetchPlatforms();
    this.setupAds();
    UI.updateHistoryBadge();
  },

  bindEvents() {
    const fetchForm = document.getElementById('fetchForm');
    const urlInput = document.getElementById('urlInput');
    const btnPaste = document.getElementById('btnPaste');
    const btnClear = document.getElementById('btnClear');
    const platformChips = document.getElementById('platformChips');
    const quickDemoList = document.getElementById('quickDemoList');

    // History Modal Elements
    const btnOpenHistory = document.getElementById('btnOpenHistory');
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    const historyModalOverlay = document.getElementById('historyModalOverlay');
    const btnClearHistory = document.getElementById('btnClearHistory');

    // Ad Modal Elements
    const adModalOverlay = document.getElementById('adModalOverlay');
    const btnCloseAdModal = document.getElementById('btnCloseAdModal');
    const btnCloseStickyAd = document.getElementById('btnCloseStickyAd');
    const stickyBottomAd = document.getElementById('stickyBottomAd');

    // Form Submit
    fetchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      if (!url) {
        UI.showToast('Vui lòng nhập hoặc dán đường link video/ảnh.', 'error');
        return;
      }
      this.analyzeUrl(url);
    });

    // Paste from clipboard button
    btnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          UI.showToast('Đã dán link từ bộ nhớ tạm!', 'info');
          this.analyzeUrl(text.trim());
        } else {
          UI.showToast('Bộ nhớ tạm đang trống.', 'error');
        }
      } catch {
        UI.showToast('Trình duyệt chưa cấp quyền truy cập clipboard. Vui lòng bấm Ctrl+V để dán.', 'error');
      }
    });

    // Clear input button
    btnClear.addEventListener('click', () => {
      urlInput.value = '';
      urlInput.focus();
    });

    // Platform filter chips
    platformChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.selectedPlatform = chip.dataset.platform;

      this.updatePlaceholder(this.selectedPlatform);
    });

    // Quick demo buttons
    quickDemoList.addEventListener('click', (e) => {
      const demoBtn = e.target.closest('.demo-btn');
      if (!demoBtn) return;
      const url = demoBtn.dataset.url;
      if (url) {
        urlInput.value = url;
        this.analyzeUrl(url);
      }
    });

    // History Drawer Open / Close
    btnOpenHistory.addEventListener('click', () => {
      UI.renderHistoryList();
      historyModalOverlay.classList.add('show');
    });

    btnCloseDrawer.addEventListener('click', () => {
      historyModalOverlay.classList.remove('show');
    });

    historyModalOverlay.addEventListener('click', (e) => {
      if (e.target === historyModalOverlay) {
        historyModalOverlay.classList.remove('show');
      }
    });

    btnClearHistory.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tải không?')) {
        localStorage.removeItem('omnifetch_history');
        UI.updateHistoryBadge();
        UI.renderHistoryList();
        UI.showToast('Đã xóa sạch lịch sử.', 'info');
      }
    });

    // Close Ad Modal
    btnCloseAdModal.addEventListener('click', () => {
      if (UI.activeDownloadTimer) clearInterval(UI.activeDownloadTimer);
      adModalOverlay.classList.remove('show');
    });

    adModalOverlay.addEventListener('click', (e) => {
      if (e.target === adModalOverlay) {
        if (UI.activeDownloadTimer) clearInterval(UI.activeDownloadTimer);
        adModalOverlay.classList.remove('show');
      }
    });

    // Close Sticky Bottom Ad
    if (btnCloseStickyAd && stickyBottomAd) {
      btnCloseStickyAd.addEventListener('click', () => {
        stickyBottomAd.classList.add('hidden');
      });
    }

    // FAQ Accordions
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isActive = item.classList.contains('active');
        
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  },

  setupAds() {
    // Setup Top Banner from ADS_CONFIG
    const topAdSlot = document.getElementById('topAdSlot');
    const topAdLink = document.getElementById('topAdLink');
    const topAdTitle = document.getElementById('topAdTitle');
    const topAdCta = document.getElementById('topAdCta');

    if (topAdSlot && ADS_CONFIG.enableTopBanner) {
      const sponsor = (ADS_CONFIG.sponsors || [])[0];
      if (sponsor) {
        topAdLink.href = sponsor.targetUrl;
        topAdTitle.textContent = sponsor.title;
        topAdCta.innerHTML = `${sponsor.ctaText} <i class="fa-solid fa-arrow-right"></i>`;
      }
    } else if (topAdSlot) {
      topAdSlot.style.display = 'none';
    }

    // Sticky Bottom Ad
    const stickyBottomAd = document.getElementById('stickyBottomAd');
    if (stickyBottomAd && !ADS_CONFIG.enableStickyBottom) {
      stickyBottomAd.style.display = 'none';
    }
  },

  updatePlaceholder(platform) {
    const urlInput = document.getElementById('urlInput');
    const placeholders = {
      all: 'Dán link Douyin, TikTok, YouTube, Facebook, Instagram vào đây...',
      douyin: 'Dán link hoặc đoạn chia sẻ Douyin (抖音) vào đây...',
      tiktok: 'Dán link TikTok (vt.tiktok.com hoặc tiktok.com/@user/video/)...',
      youtube: 'Dán link YouTube hoặc YouTube Shorts...',
      facebook: 'Dán link video hoặc Facebook Reels...',
      instagram: 'Dán link Instagram Reels hoặc Post...'
    };
    urlInput.placeholder = placeholders[platform] || placeholders.all;
  },

  async fetchPlatforms() {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      if (data.success && data.platforms) {
        this.renderPlatformsGrid(data.platforms);
      }
    } catch (e) {
      console.warn('Could not fetch platforms:', e);
    }
  },

  renderPlatformsGrid(platforms) {
    const grid = document.getElementById('platformsGrid');
    if (!grid) return;

    grid.innerHTML = platforms.map(p => `
      <div class="platform-card">
        <div class="platform-card-header">
          <div class="platform-icon-box" style="background: ${p.color}20; color: ${p.color};">
            <i class="${p.icon}"></i>
          </div>
          <span class="badge-pill" style="background: ${p.color}20; color: ${p.color}; border: 1px solid ${p.color}40;">
            ${p.badge}
          </span>
        </div>
        <h4>${p.name}</h4>
        <ul class="platform-features-list">
          ${p.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  },

  async analyzeUrl(url) {
    UI.setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const json = await response.json();

      if (response.ok && json.success && json.data) {
        UI.renderResult(json.data, url);
      } else {
        throw new Error(json.message || 'Không thể xử lý link này. Vui lòng kiểm tra lại.');
      }
    } catch (error) {
      UI.showToast(error.message, 'error', 5000);
    } finally {
      UI.setLoading(false);
    }
  },

  analyzeHistoryUrl(url) {
    const historyModalOverlay = document.getElementById('historyModalOverlay');
    historyModalOverlay.classList.remove('show');
    const urlInput = document.getElementById('urlInput');
    urlInput.value = url;
    this.analyzeUrl(url);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
