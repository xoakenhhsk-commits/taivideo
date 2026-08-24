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

    // 3. Engine 1: TikWM API (Try resolved URL first, then clean URL)
    const testUrls = [resolvedUrl, cleanUrl];
    if (itemId) {
      testUrls.unshift(`https://www.douyin.com/video/${itemId}`);
      testUrls.unshift(`https://www.iesdouyin.com/share/video/${itemId}/`);
    }

    for (const targetUrl of testUrls) {
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
            timeout: 10000
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
            label: 'Tải qua Cổng SnapTik Douyin (Dự phòng)',
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
        // Try next candidate
      }
    }

    // 4. Engine 2: Douyin Web Detail API
    if (itemId) {
      try {
        const detailRes = await axios.get(`https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id=${itemId}&aid=1128&version_name=23.5.0&device_platform=android&os_version=2333`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://www.douyin.com/video/${itemId}`,
            'Cookie': 's_v_web_id=verify_lay2478d_8Z4a9e9g_tD8M_4m8j_9fD9_9d1a1b1c1d1e;'
          },
          timeout: 8000
        });

        if (detailRes.data?.aweme_detail) {
          const aweme = detailRes.data.aweme_detail;
          const isImages = Array.isArray(aweme.images) && aweme.images.length > 0;
          const downloads = [];

          if (isImages) {
            const imgUrls = aweme.images.map(img => img.url_list?.[0]).filter(Boolean);
            downloads.push({
              type: 'album',
              label: `Bộ sưu tập ảnh Douyin (${imgUrls.length} ảnh HD)`,
              quality: 'HD Photos',
              images: imgUrls
            });
          } else if (aweme.video?.play_addr?.url_list?.length > 0) {
            const directPlay = aweme.video.play_addr.url_list[0].replace('playwm', 'play');
            downloads.push({
              type: 'video',
              label: 'Tải Video Douyin HD Không Logo (1080p)',
              quality: '1080p HD',
              url: directPlay,
              ext: 'mp4',
              badge: 'No-Watermark'
            });
          }

          if (aweme.music?.play_url?.url_list?.length > 0) {
            downloads.push({
              type: 'audio',
              label: 'Tách Nhạc Nền Douyin (Audio MP3 Gốc)',
              quality: '320kbps MP3',
              url: aweme.music.play_url.url_list[0],
              ext: 'mp3',
              badge: 'Audio MP3'
            });
          }

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
            title: aweme.desc || 'Douyin Video (抖音)',
            author: {
              name: aweme.author?.nickname || 'Douyin User',
              username: aweme.author?.unique_id || '',
              avatar: aweme.author?.avatar_thumb?.url_list?.[0] || ''
            },
            cover: aweme.video?.cover?.url_list?.[0] || '',
            duration: Math.round((aweme.duration || 0) / 1000),
            stats: {
              likes: aweme.statistics?.digg_count || 0,
              views: aweme.statistics?.play_count || 0,
              comments: aweme.statistics?.comment_count || 0,
              shares: aweme.statistics?.share_count || 0
            },
            downloads
          };
        }
      } catch (detailErr) {
        console.warn('Douyin detail err:', detailErr.message);
      }
    }

    // 5. Ultimate Fallback: Gateways
    return {
      platform: 'douyin',
      title: 'Douyin Video (抖音)',
      author: {
        name: 'Douyin Creator',
        username: '',
        avatar: 'https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/logo.png'
      },
      cover: 'https://p3-pc-sign.douyinpic.com/tos-cn-p-0015/logo.png',
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads: [
        {
          type: 'video',
          label: 'Tải Video Douyin Không Logo (Qua Cổng SnapTik)',
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
