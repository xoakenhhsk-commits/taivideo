const axios = require('axios');

/**
 * Douyin (抖音) Video & Photo Album Extractor (Multi-Engine & Auto-Redirect)
 */
async function extractDouyin(rawInput) {
  try {
    if (!rawInput || typeof rawInput !== 'string') {
      throw new Error('Vui lòng nhập đường link hoặc đoạn chia sẻ Douyin hợp lệ.');
    }

    // 1. Clean URL from Chinese text / Share text
    const match = rawInput.match(/(https?:\/\/[a-zA-Z0-9.\-_/]*douyin\.com\/[a-zA-Z0-9._\-\/?=&%]+)/i) ||
                  rawInput.match(/https?:\/\/[^\s\u4e00-\u9fa5]+/);
    let cleanUrl = match ? match[0] : rawInput.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // 2. Follow redirects for short links (v.douyin.com)
    let resolvedUrl = cleanUrl;
    let itemId = null;

    try {
      const redirectRes = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        maxRedirects: 10,
        timeout: 9000,
        validateStatus: () => true
      });

      if (redirectRes.request?.res?.responseUrl) {
        resolvedUrl = redirectRes.request.res.responseUrl;
      }
    } catch (redirectErr) {
      console.warn('Douyin redirect check warning:', redirectErr.message);
    }

    // Extract item ID (19 digits)
    const idMatch = resolvedUrl.match(/(?:video|note)\/(\d+)/) ||
                    resolvedUrl.match(/modal_id=(\d+)/) ||
                    resolvedUrl.match(/item_ids=(\d+)/) ||
                    cleanUrl.match(/(?:video|note)\/(\d+)/);
    if (idMatch) {
      itemId = idMatch[1];
    }

    // 3. Engine 1: TikWM API
    for (const targetUrl of [resolvedUrl, cleanUrl]) {
      try {
        const tikwmRes = await axios.post(
          'https://www.tikwm.com/api/',
          new URLSearchParams({
            url: targetUrl,
            count: 12,
            cursor: 0,
            web: 1,
            hd: 1
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 12000
          }
        );

        const data = tikwmRes.data;
        if (data && data.code === 0 && data.data) {
          const res = data.data;
          const isImages = Array.isArray(res.images) && res.images.length > 0;
          const downloads = [];

          if (isImages) {
            downloads.push({
              type: 'album',
              label: `Bộ sưu tập ảnh Douyin (${res.images.length} ảnh HD)`,
              quality: 'HD Photos',
              images: res.images
            });
          } else {
            if (res.hdplay) {
              const hdUrl = res.hdplay.startsWith('http') ? res.hdplay : `https://www.tikwm.com${res.hdplay}`;
              downloads.push({
                type: 'video',
                label: 'Tải Video Douyin Full HD 1080p (Không Logo)',
                quality: '1080p Full HD',
                url: hdUrl,
                ext: 'mp4',
                badge: 'Douyin 1080p'
              });
            }
            if (res.play) {
              const playUrl = res.play.startsWith('http') ? res.play : `https://www.tikwm.com${res.play}`;
              downloads.push({
                type: 'video',
                label: 'Tải Video Douyin Chuẩn (Không Logo / 720p)',
                quality: '720p HD',
                url: playUrl,
                ext: 'mp4',
                badge: 'No-Watermark'
              });
            }
          }

          // Audio
          if (res.music) {
            const musicUrl = res.music.startsWith('http') ? res.music : `https://www.tikwm.com${res.music}`;
            downloads.push({
              type: 'audio',
              label: 'Tách Nhạc Nền Douyin (Audio MP3 Gốc)',
              quality: '320kbps MP3',
              url: musicUrl,
              ext: 'mp3',
              badge: 'Audio MP3'
            });
          }

          // Cover
          if (res.cover) {
            const coverUrl = res.cover.startsWith('http') ? res.cover : `https://www.tikwm.com${res.cover}`;
            downloads.push({
              type: 'image',
              label: 'Tải Ảnh Bìa Douyin (Cover HD)',
              quality: 'Cover HD',
              url: coverUrl,
              ext: 'jpg',
              badge: 'Cover'
            });
          }

          // Fast Web Gateways for Douyin
          downloads.push({
            type: 'video',
            label: 'Tải qua Cổng SnapTik Douyin',
            quality: '1080p HD',
            url: `https://snaptik.app/vn?url=${encodeURIComponent(cleanUrl)}`,
            isExternal: true,
            ext: 'mp4',
            badge: 'SnapTik'
          });

          return {
            platform: 'douyin',
            title: res.title || 'Douyin Video (抖音)',
            author: {
              name: res.author?.nickname || 'Douyin User',
              username: res.author?.unique_id || '',
              avatar: res.author?.avatar || ''
            },
            cover: res.cover ? (res.cover.startsWith('http') ? res.cover : `https://www.tikwm.com${res.cover}`) : '',
            duration: res.duration || 0,
            stats: {
              likes: res.digg_count || 0,
              views: res.play_count || 0,
              comments: res.comment_count || 0,
              shares: res.share_count || 0
            },
            downloads
          };
        }
      } catch (e) {
        console.warn('TikWM attempt failed:', e.message);
      }
    }

    // 4. Engine 2: Douyin ItemInfo API (Official fallback)
    if (itemId) {
      try {
        const itemRes = await axios.get(`https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${itemId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
          },
          timeout: 8000
        });

        if (itemRes.data?.item_list && itemRes.data.item_list.length > 0) {
          const item = itemRes.data.item_list[0];
          const isImages = Array.isArray(item.images) && item.images.length > 0;
          const downloads = [];

          if (isImages) {
            const imgUrls = item.images.map(img => img.url_list?.[0] || img.url_list?.[1]).filter(Boolean);
            downloads.push({
              type: 'album',
              label: `Bộ sưu tập ảnh Douyin (${imgUrls.length} ảnh HD)`,
              quality: 'HD Photos',
              images: imgUrls
            });
          } else if (item.video?.play_addr?.url_list?.length > 0) {
            // Replace playwm with play to remove watermark
            const rawVideoUrl = item.video.play_addr.url_list[0].replace('playwm', 'play');
            downloads.push({
              type: 'video',
              label: 'Tải Video Douyin HD (Không Logo)',
              quality: '1080p / 720p HD',
              url: rawVideoUrl,
              ext: 'mp4',
              badge: 'No-Watermark'
            });
          }

          if (item.music?.play_url?.url_list?.length > 0) {
            downloads.push({
              type: 'audio',
              label: 'Tách Nhạc Nền Douyin (Audio MP3)',
              quality: '320kbps MP3',
              url: item.music.play_url.url_list[0],
              ext: 'mp3',
              badge: 'Audio MP3'
            });
          }

          // Gateways
          downloads.push({
            type: 'video',
            label: 'Tải qua Cổng SnapTik Douyin',
            quality: '1080p HD',
            url: `https://snaptik.app/vn?url=${encodeURIComponent(cleanUrl)}`,
            isExternal: true,
            ext: 'mp4',
            badge: 'SnapTik'
          });

          return {
            platform: 'douyin',
            title: item.desc || 'Douyin Video (抖音)',
            author: {
              name: item.author?.nickname || 'Douyin User',
              username: item.author?.unique_id || '',
              avatar: item.author?.avatar_thumb?.url_list?.[0] || ''
            },
            cover: item.video?.cover?.url_list?.[0] || '',
            duration: Math.round((item.duration || 0) / 1000),
            stats: {
              likes: item.statistics?.digg_count || 0,
              views: item.statistics?.play_count || 0,
              comments: item.statistics?.comment_count || 0,
              shares: item.statistics?.share_count || 0
            },
            downloads
          };
        }
      } catch (itemErr) {
        console.warn('Douyin iteminfo fallback error:', itemErr.message);
      }
    }

    // 5. Ultimate Fallback: Gateways
    return {
      platform: 'douyin',
      title: 'Douyin Video (抖音)',
      author: {
        name: 'Douyin Creator',
        username: '',
        avatar: ''
      },
      cover: 'https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/logo.png',
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads: [
        {
          type: 'video',
          label: 'Tải Video Douyin (Qua Cổng SnapTik HD)',
          quality: '1080p Full HD',
          url: `https://snaptik.app/vn?url=${encodeURIComponent(cleanUrl)}`,
          isExternal: true,
          ext: 'mp4',
          badge: 'SnapTik HD'
        },
        {
          type: 'video',
          label: 'Tải Video Douyin (Qua Cổng SSSTik)',
          quality: 'HD Stream',
          url: `https://ssstik.io/vi?url=${encodeURIComponent(cleanUrl)}`,
          isExternal: true,
          ext: 'mp4',
          badge: 'SSSTik'
        }
      ]
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Douyin: ${error.message}`);
  }
}

module.exports = { extractDouyin };
