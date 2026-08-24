const axios = require('axios');

/**
 * Douyin (抖音) Video & Audio Extractor
 */
async function extractDouyin(url) {
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
          label: `Bộ sưu tập ảnh Douyin (${res.images.length} ảnh HD)`,
          quality: 'HD Photos',
          images: res.images
        });
      } else {
        if (res.hdplay) {
          downloads.push({
            type: 'video',
            label: 'Tải Video Douyin Full HD (Không Logo / 1080p)',
            quality: '1080p / HD',
            url: res.hdplay.startsWith('http') ? res.hdplay : `https://www.tikwm.com${res.hdplay}`,
            ext: 'mp4',
            badge: 'Douyin 1080p'
          });
        }
        if (res.play) {
          downloads.push({
            type: 'video',
            label: 'Tải Video Douyin Chuẩn (Không Logo / 720p)',
            quality: '720p / SD',
            url: res.play.startsWith('http') ? res.play : `https://www.tikwm.com${res.play}`,
            ext: 'mp4',
            badge: 'No-Watermark'
          });
        }
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

      // Audio download
      if (res.music) {
        downloads.push({
          type: 'audio',
          label: 'Tách Nhạc Nền Douyin (Audio MP3 Gốc)',
          quality: '320kbps MP3',
          url: res.music.startsWith('http') ? res.music : `https://www.tikwm.com${res.music}`,
          ext: 'mp3',
          badge: 'Audio MP3'
        });
      }

      // Cover
      if (res.cover) {
        downloads.push({
          type: 'image',
          label: 'Ảnh Bìa Douyin (Cover HD)',
          quality: 'Cover HD',
          url: res.cover.startsWith('http') ? res.cover : `https://www.tikwm.com${res.cover}`,
          ext: 'jpg',
          badge: 'Cover'
        });
      }

      return {
        platform: 'douyin',
        title: res.title || 'Douyin Video (抖音)',
        author: {
          name: res.author ? res.author.nickname : 'Douyin User',
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

    // Fallback: Direct stream + SnapTik
    return {
      platform: 'douyin',
      title: 'Douyin Video (抖音)',
      author: { name: 'Douyin Creator', avatar: '' },
      cover: '',
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads: [
        {
          type: 'video',
          label: 'Tải Trực Tiếp Video Douyin (Có Tiếng + Hình)',
          quality: '1080p HD',
          url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp4`,
          isDirectStream: true,
          ext: 'mp4',
          badge: 'Direct HD'
        },
        {
          type: 'video',
          label: 'Tải qua Cổng SnapTik Douyin',
          quality: 'Full HD',
          url: `https://snaptik.app/vn?url=${encodeURIComponent(cleanUrl)}`,
          isExternal: true,
          ext: 'mp4',
          badge: 'SnapTik'
        }
      ]
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Douyin: ${error.message}`);
  }
}

module.exports = { extractDouyin };
