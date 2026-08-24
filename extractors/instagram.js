/**
 * Instagram Reels & Post Extractor
 */
async function extractInstagram(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    const downloads = [
      {
        type: 'video',
        label: 'Tải Trực Tiếp Instagram Reels HD (Có Tiếng + Hình)',
        quality: '1080p HD',
        url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp4`,
        isDirectStream: true,
        ext: 'mp4',
        badge: 'Direct HD'
      },
      {
        type: 'video',
        label: 'Tải qua Cổng SnapInsta (Instagram HD)',
        quality: 'Full HD',
        url: `https://snapinsta.app/vi?url=${encodeURIComponent(cleanUrl)}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SnapInsta'
      },
      {
        type: 'video',
        label: 'Tải qua Cổng SaveIG',
        quality: 'HD Stream',
        url: `https://saveig.app/vi?url=${encodeURIComponent(cleanUrl)}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SaveIG'
      },
      {
        type: 'audio',
        label: 'Tách Nhạc Instagram (MP3 320kbps)',
        quality: '320kbps MP3',
        url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp3`,
        isDirectStream: true,
        ext: 'mp3',
        badge: 'Audio MP3'
      }
    ];

    return {
      platform: 'instagram',
      title: 'Instagram Media & Reels',
      author: {
        name: 'Instagram Creator',
        username: '',
        avatar: 'https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png'
      },
      cover: 'https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png',
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Instagram: ${error.message}`);
  }
}

module.exports = { extractInstagram };
