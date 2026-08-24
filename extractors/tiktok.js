const axios = require('axios');

/**
 * TikTok Video & Audio Extractor with Multi-Gateway Support
 */
async function extractTikTok(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    // Use TikWM API
    const response = await axios.post(
      'https://www.tikwm.com/api/',
      new URLSearchParams({
        url: cleanUrl,
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
        timeout: 15000
      }
    );

    const data = response.data;
    if (data && data.code === 0 && data.data) {
      const res = data.data;
      const isImages = Array.isArray(res.images) && res.images.length > 0;

      const downloads = [];

      if (isImages) {
        downloads.push({
          type: 'album',
          label: `Bộ sưu tập ảnh TikTok (${res.images.length} ảnh HD)`,
          quality: 'HD Photos',
          images: res.images
        });
      } else {
        if (res.hdplay) {
          downloads.push({
            type: 'video',
            label: 'Tải Video TikTok HD (Không Logo / No Watermark)',
            quality: '1080p / HD',
            url: res.hdplay.startsWith('http') ? res.hdplay : `https://www.tikwm.com${res.hdplay}`,
            ext: 'mp4',
            badge: 'HD No-Watermark'
          });
        }
        if (res.play) {
          downloads.push({
            type: 'video',
            label: 'Tải Video TikTok Chuẩn (Không Logo / SD)',
            quality: '720p / SD',
            url: res.play.startsWith('http') ? res.play : `https://www.tikwm.com${res.play}`,
            ext: 'mp4',
            badge: 'No-Watermark'
          });
        }
      }

      // Fast Web Gateways for TikTok
      downloads.push({
        type: 'video',
        label: 'Tải qua Cổng SnapTik (TikTok Không Logo)',
        quality: 'Full HD',
        url: `https://snaptik.app/vn?url=${encodeURIComponent(cleanUrl)}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SnapTik HD'
      });

      downloads.push({
        type: 'video',
        label: 'Tải qua Cổng SSSTik (TikTok Downloader)',
        quality: 'HD Stream',
        url: `https://ssstik.io/vi?url=${encodeURIComponent(cleanUrl)}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SSSTik'
      });

      // Audio download
      if (res.music) {
        downloads.push({
          type: 'audio',
          label: 'Tách Nhạc Nền TikTok (MP3 320kbps)',
          quality: '320kbps MP3',
          url: res.music.startsWith('http') ? res.music : `https://www.tikwm.com${res.music}`,
          ext: 'mp3',
          badge: 'Audio MP3'
        });
      }

      // Cover download
      if (res.cover) {
        downloads.push({
          type: 'image',
          label: 'Ảnh Bìa TikTok (Cover HD)',
          quality: 'Cover HD',
          url: res.cover.startsWith('http') ? res.cover : `https://www.tikwm.com${res.cover}`,
          ext: 'jpg',
          badge: 'Cover'
        });
      }

      return {
        platform: 'tiktok',
        title: res.title || 'TikTok Video',
        author: {
          name: res.author ? res.author.nickname : 'TikTok User',
          username: res.author ? res.author.unique_id : '',
          avatar: res.author ? res.author.avatar : ''
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

    // Fallback: yt-dlp direct stream + Web Gateways
    return {
      platform: 'tiktok',
      title: 'TikTok Video',
      author: { name: 'TikTok Creator', avatar: '' },
      cover: '',
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads: [
        {
          type: 'video',
          label: 'Tải Trực Tiếp Video TikTok (Có Tiếng + Hình)',
          quality: 'HD MP4',
          url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp4`,
          isDirectStream: true,
          ext: 'mp4',
          badge: 'Direct HD'
        },
        {
          type: 'video',
          label: 'Tải qua Cổng SnapTik (TikTok Không Logo)',
          quality: 'Full HD',
          url: `https://snaptik.app/vn?url=${encodeURIComponent(cleanUrl)}`,
          isExternal: true,
          ext: 'mp4',
          badge: 'SnapTik'
        },
        {
          type: 'video',
          label: 'Tải qua Cổng SSSTik',
          quality: 'HD MP4',
          url: `https://ssstik.io/vi?url=${encodeURIComponent(cleanUrl)}`,
          isExternal: true,
          ext: 'mp4',
          badge: 'SSSTik'
        }
      ]
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích TikTok: ${error.message}`);
  }
}

module.exports = { extractTikTok };
