const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Instagram Reels & Post Extractor
 */
async function extractInstagram(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    let title = 'Instagram Reels & Media';
    let cover = 'https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png';
    let directVideoUrl = null;

    try {
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 8000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      title = $('meta[property="og:title"]').attr('content') || title;
      cover = $('meta[property="og:image"]').attr('content') || cover;

      const videoMatch = html.match(/["']video_url["']\s*:\s*["']([^"']+)["']/) ||
                         html.match(/["']browser_native_hd_url["']\s*:\s*["']([^"']+)["']/);

      if (videoMatch && videoMatch[1]) {
        directVideoUrl = videoMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
      }
    } catch (e) {
      console.warn('Instagram direct scrape warning:', e.message);
    }

    const downloads = [];

    // 1. Direct Video Stream if found
    if (directVideoUrl) {
      downloads.push({
        type: 'video',
        label: 'Tải Trực Tiếp Instagram Reels HD (Không Logo)',
        quality: '1080p HD',
        url: directVideoUrl,
        ext: 'mp4',
        badge: 'Direct HD'
      });
    }

    // 2. Fast Web Gateways for Instagram
    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng SnapInsta (Instagram HD)',
      quality: 'Full HD 1080p',
      url: `https://snapinsta.app/vi?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'SnapInsta'
    });

    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng SaveIG (Tải Video & Ảnh)',
      quality: 'HD Stream',
      url: `https://saveig.app/vi?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'SaveIG'
    });

    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng FastDL (Instagram Downloader)',
      quality: 'HD Media',
      url: `https://fastdl.app/vi?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'FastDL'
    });

    // 3. Cover/Photo
    if (cover && cover.startsWith('http')) {
      downloads.push({
        type: 'image',
        label: 'Tải Ảnh Bìa / Hình Ảnh Instagram',
        quality: 'HD Photo',
        url: cover,
        ext: 'jpg',
        badge: 'Photo/Cover'
      });
    }

    return {
      platform: 'instagram',
      title: title.replace(/\| Instagram/g, '').trim(),
      author: {
        name: 'Instagram Creator',
        username: '',
        avatar: 'https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png'
      },
      cover,
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Instagram: ${error.message}`);
  }
}

module.exports = { extractInstagram };
