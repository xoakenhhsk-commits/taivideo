/**
 * UI Utilities, DOM Renderers and Monetization Ad System for OmniFetch
 */

const UI = {
  activeDownloadTimer: null,
  pendingDownload: null,

  // Show Toast Notification
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Toggle Loading Skeleton
  setLoading(isLoading) {
    const skeleton = document.getElementById('skeletonCard');
    const resultSection = document.getElementById('resultSection');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = btnSubmit.querySelector('.btn-text');
    const btnLoader = btnSubmit.querySelector('.btn-loader');

    if (isLoading) {
      skeleton.style.display = 'block';
      resultSection.style.display = 'none';
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
      btnSubmit.disabled = true;
    } else {
      skeleton.style.display = 'none';
      btnText.style.display = 'inline-flex';
      btnLoader.style.display = 'none';
      btnSubmit.disabled = false;
    }
  },

  // Render Result Card
  renderResult(data, originalUrl) {
    const resultSection = document.getElementById('resultSection');
    const authorAvatar = document.getElementById('authorAvatar');
    const authorName = document.getElementById('authorName');
    const platformBadge = document.getElementById('platformBadge');
    const videoTitle = document.getElementById('videoTitle');
    const metricLikes = document.getElementById('metricLikes');
    const metricViews = document.getElementById('metricViews');
    const videoWrapper = document.getElementById('videoWrapper');
    const videoPlayer = document.getElementById('videoPlayer');
    const albumGrid = document.getElementById('albumGrid');
    const downloadGrid = document.getElementById('downloadGrid');
    const audioPlayerBox = document.getElementById('audioPlayerBox');
    const audioPreview = document.getElementById('audioPreview');

    // Fill metadata
    authorAvatar.src = data.author?.avatar || 'https://ui-avatars.com/api/?name=User&background=random';
    authorName.textContent = data.author?.name || 'Tác giả';
    platformBadge.textContent = (data.platform || 'Media').toUpperCase();
    videoTitle.textContent = data.title || 'Video Media';

    // Metrics
    metricLikes.innerHTML = `<i class="fa-solid fa-heart"></i> ${UI.formatNumber(data.stats?.likes || 0)}`;
    metricViews.innerHTML = `<i class="fa-solid fa-play"></i> ${UI.formatNumber(data.stats?.views || 0)}`;

    // Reset video & audio players
    videoPlayer.pause();
    audioPreview.pause();
    videoPlayer.src = '';
    audioPreview.src = '';

    // Handle photo album or video
    const albumDownload = data.downloads.find(d => d.type === 'album');
    const videoDownloads = data.downloads.filter(d => d.type === 'video');
    const audioDownload = data.downloads.find(d => d.type === 'audio');

    if (albumDownload && albumDownload.images) {
      videoWrapper.style.display = 'none';
      albumGrid.style.display = 'grid';
      albumGrid.innerHTML = albumDownload.images.map((imgUrl, idx) => `
        <div class="album-item">
          <img src="${imgUrl}" alt="Photo ${idx + 1}" loading="lazy">
          <button class="album-download-btn" onclick="UI.triggerDownloadWithAd('${encodeURIComponent(imgUrl)}', '${encodeURIComponent((data.title || 'image') + '_' + (idx + 1) + '.jpg')}', false)">
            <i class="fa-solid fa-download"></i> Tải ảnh
          </button>
        </div>
      `).join('');
    } else {
      albumGrid.style.display = 'none';
      videoWrapper.style.display = 'block';

      // Pick direct video stream for in-browser player preview
      const previewStream = videoDownloads.find(d => d.url && !d.isExternal) || videoDownloads[0];
      if (previewStream && previewStream.url && !previewStream.isExternal) {
        videoPlayer.poster = data.cover || '';
        videoPlayer.src = previewStream.url;
      }
    }

    // Audio Preview
    if (audioDownload && audioDownload.url && !audioDownload.url.startsWith('/api/') && !audioDownload.isExternal) {
      audioPlayerBox.style.display = 'block';
      audioPreview.src = audioDownload.url;
    } else {
      audioPlayerBox.style.display = 'none';
    }

    // Render Download Buttons
    downloadGrid.innerHTML = '';
    data.downloads.forEach((dl, index) => {
      if (dl.type === 'album') return;

      const isHighLight = index === 0 && dl.type === 'video';
      const dlCard = document.createElement('div');
      dlCard.className = `download-btn-card ${isHighLight ? 'highlight' : ''}`;

      let iconClass = 'fa-film';
      let iconColorType = 'video';
      if (dl.type === 'audio') {
        iconClass = 'fa-music';
        iconColorType = 'audio';
      } else if (dl.type === 'image') {
        iconClass = 'fa-image';
        iconColorType = 'image';
      }

      const fileExtension = dl.ext || (dl.type === 'audio' ? 'mp3' : (dl.type === 'image' ? 'jpg' : 'mp4'));
      const targetFilename = `[OmniFetch_${data.platform}]_${(data.title || 'media').substring(0, 40)}.${fileExtension}`;

      dlCard.innerHTML = `
        <div class="btn-card-left">
          <div class="btn-card-icon ${iconColorType}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="btn-card-info">
            <h5>${dl.label} <span class="badge-pill">${dl.badge || dl.quality}</span></h5>
            <span>Định dạng: .${fileExtension.toUpperCase()} • Độ nét: ${dl.quality}</span>
          </div>
        </div>

        <div class="btn-card-actions">
          <button class="btn-action-secondary" title="Sao chép link tải" onclick="UI.copyToClipboard('${dl.url}')">
            <i class="fa-regular fa-copy"></i>
          </button>
          <button 
            type="button"
            class="btn-action-primary" 
            onclick="UI.triggerDownloadWithAd('${encodeURIComponent(dl.url)}', '${encodeURIComponent(targetFilename)}', ${!!dl.isExternal})"
          >
            <i class="fa-solid ${dl.isExternal ? 'fa-arrow-up-right-from-square' : 'fa-cloud-arrow-down'}"></i>
            <span>${dl.isExternal ? 'Mở cổng tải' : 'Tải về máy'}</span>
          </button>
        </div>
      `;

      downloadGrid.appendChild(dlCard);
    });

    // Save to LocalStorage History
    UI.saveHistory({
      platform: data.platform,
      title: data.title,
      author: data.author?.name,
      cover: data.cover,
      url: originalUrl,
      timestamp: Date.now()
    });

    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    UI.showToast('Phân tích link thành công! Nhấn "Tải về máy" để lưu file.', 'success');
  },

  // Interstitial Ad & Download Trigger
  triggerDownloadWithAd(encodedUrl, encodedFilename, isExternal = false) {
    const rawMediaUrl = decodeURIComponent(encodedUrl);
    const filename = decodeURIComponent(encodedFilename);

    // 1. TỰ ĐỘNG MỞ TAB QUẢNG CÁO KIẾM TIỀN (POPUNDER / DIRECT LINK)
    if (ADS_CONFIG.enablePopunderOnDownload && ADS_CONFIG.directPopunderUrl) {
      try {
        window.open(ADS_CONFIG.directPopunderUrl, '_blank');
      } catch (e) {
        console.warn('Popup blocked by browser:', e);
      }
    }

    if (isExternal) {
      // External fast gateway: Open in separate window
      window.open(rawMediaUrl, '_blank');
      return;
    }

    // Direct stream URL builder
    let downloadApiUrl = '';
    if (rawMediaUrl.startsWith('/api/stream-ytdl')) {
      downloadApiUrl = `${rawMediaUrl}&filename=${encodeURIComponent(filename)}`;
    } else {
      downloadApiUrl = `/api/proxy-download?url=${encodeURIComponent(rawMediaUrl)}&filename=${encodeURIComponent(filename)}`;
    }

    // If modal ad disabled, download directly
    if (!ADS_CONFIG.enableModalAd) {
      UI.executeDirectDownload(downloadApiUrl, filename);
      return;
    }

    // Pick random sponsor ad from config
    const sponsors = ADS_CONFIG.sponsors || [];
    const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)] || sponsors[0];

    // Populate Sponsor Modal Content
    const adModalOverlay = document.getElementById('adModalOverlay');
    const modalSponsorLink = document.getElementById('modalSponsorLink');
    const modalSponsorImg = document.getElementById('modalSponsorImg');
    const modalSponsorBadge = document.getElementById('modalSponsorBadge');
    const modalSponsorTitle = document.getElementById('modalSponsorTitle');
    const modalSponsorDesc = document.getElementById('modalSponsorDesc');
    const modalSponsorCta = document.getElementById('modalSponsorCta');

    if (sponsor) {
      modalSponsorLink.href = sponsor.targetUrl;
      modalSponsorImg.src = sponsor.bannerImg;
      modalSponsorBadge.textContent = sponsor.badge;
      modalSponsorTitle.textContent = sponsor.title;
      modalSponsorDesc.textContent = sponsor.description;
      modalSponsorCta.innerHTML = `${sponsor.ctaText} <i class="fa-solid fa-arrow-up-right-from-square"></i>`;
    }

    // Setup Countdown Timer
    let secondsLeft = ADS_CONFIG.countdownSeconds || 5;
    const adCountdownText = document.getElementById('adCountdownText');
    const adSecondsLeft = document.getElementById('adSecondsLeft');
    const btnStartDownloadNow = document.getElementById('btnStartDownloadNow');
    const downloadBtnSpinner = document.getElementById('downloadBtnSpinner');
    const downloadBtnText = document.getElementById('downloadBtnText');

    adCountdownText.textContent = secondsLeft;
    adSecondsLeft.textContent = secondsLeft;
    btnStartDownloadNow.disabled = true;
    downloadBtnSpinner.style.display = 'inline-block';
    downloadBtnText.textContent = `Đang chuẩn bị link tải (${secondsLeft}s)...`;

    // Save pending download URL
    UI.pendingDownload = { url: downloadApiUrl, filename };

    // Show Modal
    adModalOverlay.classList.add('show');

    // Clear previous timer if any
    if (UI.activeDownloadTimer) clearInterval(UI.activeDownloadTimer);

    UI.activeDownloadTimer = setInterval(() => {
      secondsLeft--;
      adCountdownText.textContent = secondsLeft;
      adSecondsLeft.textContent = secondsLeft;
      downloadBtnText.textContent = `Đang chuẩn bị link tải (${secondsLeft}s)...`;

      if (secondsLeft <= 0) {
        clearInterval(UI.activeDownloadTimer);
        btnStartDownloadNow.disabled = false;
        downloadBtnSpinner.style.display = 'none';
        downloadBtnText.textContent = '🚀 Bắt đầu tải file ngay!';

        // Trigger automatic direct file download
        UI.executeDirectDownload(downloadApiUrl, filename);
        UI.showToast(`Bắt đầu tải: ${filename}`, 'success');

        // Close ad modal after 2.5s
        setTimeout(() => {
          adModalOverlay.classList.remove('show');
        }, 2500);
      }
    }, 1000);

    // Allow user to click download button once enabled
    btnStartDownloadNow.onclick = () => {
      UI.executeDirectDownload(downloadApiUrl, filename);
      adModalOverlay.classList.remove('show');
    };
  },

  // Perform actual file download via invisible iframe/anchor
  executeDirectDownload(url, filename) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 1000);
  },

  // Format numbers
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  },

  // Copy to clipboard helper
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      UI.showToast('Đã sao chép đường link vào clipboard!', 'success');
    } catch {
      UI.showToast('Không thể sao chép tự động.', 'error');
    }
  },

  // LocalStorage History
  saveHistory(item) {
    try {
      let history = JSON.parse(localStorage.getItem('omnifetch_history') || '[]');
      history = history.filter(h => h.url !== item.url);
      history.unshift(item);
      if (history.length > 20) history = history.slice(0, 20);
      localStorage.setItem('omnifetch_history', JSON.stringify(history));
      UI.updateHistoryBadge();
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  },

  updateHistoryBadge() {
    try {
      const history = JSON.parse(localStorage.getItem('omnifetch_history') || '[]');
      const badge = document.getElementById('historyBadge');
      if (badge) badge.textContent = history.length;
    } catch {
      // Ignore
    }
  },

  renderHistoryList() {
    const list = document.getElementById('historyList');
    if (!list) return;

    try {
      const history = JSON.parse(localStorage.getItem('omnifetch_history') || '[]');
      if (history.length === 0) {
        list.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
            <i class="fa-solid fa-clock-rotate-left" style="font-size: 32px; margin-bottom: 12px; display: block;"></i>
            <p>Chưa có lịch sử tải xuống nào.</p>
          </div>
        `;
        return;
      }

      list.innerHTML = history.map(item => `
        <div class="history-item">
          <img src="${item.cover || 'https://ui-avatars.com/api/?name=Media'}" class="history-thumb" alt="Thumb" onerror="this.src='https://ui-avatars.com/api/?name=Media'">
          <div class="history-info">
            <div class="history-title" title="${item.title}">${item.title || 'Video Không Tên'}</div>
            <div class="history-author">
              <span class="badge-pill">${(item.platform || 'Media').toUpperCase()}</span>
              <span>${item.author || ''}</span>
            </div>
          </div>
          <button class="btn-reload-history" onclick="App.analyzeHistoryUrl('${item.url}')" title="Phân tích lại">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      `).join('');
    } catch {
      list.innerHTML = '<p>Lỗi đọc lịch sử.</p>';
    }
  }
};
