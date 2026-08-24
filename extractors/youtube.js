/**
 * YouTube & YouTube Shorts Extractor (Universal Fast Gateways & Thumbnails)
 */
async function extractYouTube(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    // Extract Video ID
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }

    let title = 'YouTube Video / Shorts';
    let authorName = 'YouTube Creator';
    let cover = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';

    const downloads = [];

    // 1. Fast Web Gateways (SaveFrom, SSYouTube, Y2Mate)
    if (videoId) {
      downloads.push({
        type: 'video',
        label: 'Tải Video YouTube MP4 Full HD (Qua Cổng SaveFrom)',
        quality: '1080p / 720p HD',
        url: `https://en.savefrom.net/1-youtube-video-downloader-719.html?url=https://www.youtube.com/watch?v=${videoId}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SaveFrom HD'
      });

      downloads.push({
        type: 'video',
        label: 'Tải Video YouTube (Qua Cổng SSYouTube)',
        quality: 'HD Stream',
        url: `https://ssyoutube.com/watch?v=${videoId}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SSYouTube'
      });

      downloads.push({
        type: 'audio',
        label: 'Tách Nhạc MP3 YouTube (Qua Cổng Y2Mate MP3)',
        quality: '320kbps MP3',
        url: `https://www.y2mate.com/youtube-mp3/${videoId}`,
        isExternal: true,
        ext: 'mp3',
        badge: 'Y2Mate MP3'
      });

      downloads.push({
        type: 'image',
        label: 'Tải Ảnh Bìa / Thumbnail MaxRes HD',
        quality: 'MaxRes HD',
        url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        ext: 'jpg',
        badge: 'Thumbnail HD'
      });
    }

    return {
      platform: 'youtube',
      videoId,
      title,
      author: {
        name: authorName,
        username: '',
        avatar: 'https://www.youtube.com/s/desktop/fca59073/img/favicon_144x144.png'
      },
      cover,
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích YouTube: ${error.message}`);
  }
}

module.exports = { extractYouTube };
