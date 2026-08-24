const { execFile } = require('child_process');
const util = require('util');
const ffmpegPath = require('ffmpeg-static');
const execFilePromise = util.promisify(execFile);

/**
 * YouTube & YouTube Shorts Extractor with Universal Playability & Multi-Gateway Support
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

    let title = 'YouTube Video';
    let authorName = 'YouTube Creator';
    let cover = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    let duration = 0;
    let likes = 0;
    let views = 0;

    // Try yt-dlp to get rich metadata
    try {
      const { stdout } = await execFilePromise('yt-dlp', [
        '--remote-components', 'ejs:github',
        '--js-runtimes', 'node:node',
        '--ffmpeg-location', ffmpegPath,
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        cleanUrl
      ], { timeout: 20000, maxBuffer: 15 * 1024 * 1024 });

      const info = JSON.parse(stdout);
      title = info.title || title;
      authorName = info.uploader || info.channel || authorName;
      cover = info.thumbnail || cover;
      duration = info.duration || 0;
      likes = info.like_count || 0;
      views = info.view_count || 0;
    } catch (e) {
      // Fallback to oembed
      console.warn('yt-dlp metadata failed, using fallback:', e.message);
    }

    const downloads = [];

    // 1. Direct Server Download MP4 Full HD (H.264 + AAC Audio)
    downloads.push({
      type: 'video',
      label: 'Tải Trực Tiếp MP4 Full HD (Có Tiếng + Hình)',
      quality: '1080p / 720p HD',
      url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp4`,
      isDirectStream: true,
      ext: 'mp4',
      badge: 'Full HD MP4'
    });

    // 2. Fast Web Gateways
    if (videoId) {
      downloads.push({
        type: 'video',
        label: 'Tải Nhanh qua Cổng SaveFrom HD',
        quality: '1080p HD',
        url: `https://en.savefrom.net/1-youtube-video-downloader-719.html?url=https://www.youtube.com/watch?v=${videoId}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SaveFrom HD'
      });

      downloads.push({
        type: 'video',
        label: 'Tải Nhanh qua Cổng SSYouTube',
        quality: 'HD Stream',
        url: `https://ssyoutube.com/watch?v=${videoId}`,
        isExternal: true,
        ext: 'mp4',
        badge: 'SSYouTube'
      });
    }

    // 3. Direct Server Audio MP3 320kbps
    downloads.push({
      type: 'audio',
      label: 'Tách Nhạc MP3 / Audio Chuẩn (320kbps)',
      quality: '320kbps MP3',
      url: `/api/stream-ytdl?url=${encodeURIComponent(cleanUrl)}&ext=mp3`,
      isDirectStream: true,
      ext: 'mp3',
      badge: 'Audio MP3'
    });

    // 4. Thumbnail HD
    downloads.push({
      type: 'image',
      label: 'Ảnh Bìa / Thumbnail MaxRes HD',
      quality: 'MaxRes HD',
      url: cover || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      ext: 'jpg',
      badge: 'Thumbnail HD'
    });

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
      duration,
      stats: { likes, views },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích YouTube: ${error.message}`);
  }
}

module.exports = { extractYouTube };
