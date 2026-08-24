/**
 * Facebook Video & Reels Extractor
 */
async function extractFacebook(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    const downloads = [
      {
        type: 'video',
        label: 'Tải Trực Tiếp Video Facebook HD (Có Tiếng + Hình)',
        quality: '1080p / 720p HD',
        url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp4`,
        isDirectStream: true,
        ext: 'mp4',
        badge: 'Direct HD'
      },
      {
        type: 'video',
        label: 'Tải qua Cổng Snapsave HD (Facebook)',
        quality: 'Full HD',
        url: `https://snapsave.app/vn?url=${encodeURIComponent(cleanUrl)}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'Snapsave HD'
      },
      {
        type: 'video',
        label: 'Tải qua Cổng FDown.net',
        quality: 'HD Stream',
        url: `https://fdown.net/download.php?url=${encodeURIComponent(cleanUrl)}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'FDown'
      },
      {
        type: 'audio',
        label: 'Tách Nhạc Facebook (MP3 320kbps)',
        quality: '320kbps MP3',
        url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp3`,
        isDirectStream: true,
        ext: 'mp3',
        badge: 'Audio MP3'
      }
    ];

    return {
      platform: 'facebook',
      title: 'Facebook Video & Reels',
      author: {
        name: 'Facebook Creator',
        username: '',
        avatar: 'https://static.xx.fbcdn.net/rsrc.php/v3/yD/r/5D8s-GsHJLe.png'
      },
      cover: 'https://static.xx.fbcdn.net/rsrc.php/v3/yD/r/5D8s-GsHJLe.png',
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Facebook: ${error.message}`);
  }
}

module.exports = { extractFacebook };
