const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Facebook Video & Reels Extractor (Direct Stream + HD/SD Parsing)
 */
async function extractFacebook(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    let title = 'Facebook Video & Reels';
    let cover = 'https://static.xx.fbcdn.net/rsrc.php/v3/yD/r/5D8s-GsHJLe.png';
    let hdUrl = null;
    let sdUrl = null;

    try {
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Fetch-Site': 'none'
        },
        timeout: 10000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Meta tags
      title = $('meta[property="og:title"]').attr('content') ||
              $('meta[name="title"]').attr('content') ||
              $('title').text() || title;

      cover = $('meta[property="og:image"]').attr('content') ||
              $('meta[property="og:image:url"]').attr('content') || cover;

      // Extract HD Stream
      const hdMatch = html.match(/["']playable_url_quality_hd["']\s*:\s*["']([^"']+)["']/) ||
                      html.match(/hd_src\s*:\s*["']([^"']+)["']/) ||
                      html.match(/["']browser_native_hd_url["']\s*:\s*["']([^"']+)["']/);

      if (hdMatch && hdMatch[1]) {
        try {
          hdUrl = JSON.parse(`"${hdMatch[1]}"`).replace(/\\/g, '');
        } catch {
          hdUrl = hdMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
        }
      }

      // Extract SD Stream
      const sdMatch = html.match(/["']playable_url["']\s*:\s*["']([^"']+)["']/) ||
                      html.match(/sd_src\s*:\s*["']([^"']+)["']/) ||
                      html.match(/["']browser_native_sd_url["']\s*:\s*["']([^"']+)["']/);

      if (sdMatch && sdMatch[1]) {
        try {
          sdUrl = JSON.parse(`"${sdMatch[1]}"`).replace(/\\/g, '');
        } catch {
          sdUrl = sdMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
        }
      }
    } catch (fetchErr) {
      console.warn('Facebook direct scrape warning:', fetchErr.message);
    }

    const downloads = [];

    // 1. Direct HD Stream (if found)
    if (hdUrl) {
      downloads.push({
        type: 'video',
        label: 'Tải Video Facebook HD 1080p (Sắc nét)',
        quality: '1080p HD',
        url: hdUrl,
        ext: 'mp4',
        badge: 'Direct HD 1080p'
      });
    }

    // 2. Direct SD Stream (if found)
    if (sdUrl) {
      downloads.push({
        type: 'video',
        label: 'Tải Video Facebook Chuẩn SD (Tốc độ cao)',
        quality: '720p SD',
        url: sdUrl,
        ext: 'mp4',
        badge: 'Direct SD'
      });
    }

    // 3. Fast Gateways (Luôn sẵn sàng)
    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng SnapSave HD (Facebook)',
      quality: 'Full HD',
      url: `https://snapsave.app/vn?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'SnapSave HD'
    });

    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng FDown.net (Facebook Downloader)',
      quality: 'HD Stream',
      url: `https://fdown.net/download.php?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'FDown'
    });

    // 4. Cover image
    if (cover && cover.startsWith('http')) {
      downloads.push({
        type: 'image',
        label: 'Tải Ảnh Bìa / Thumbnail Facebook',
        quality: 'HD Cover',
        url: cover,
        ext: 'jpg',
        badge: 'Cover'
      });
    }

    return {
      platform: 'facebook',
      title: title.replace(/\| Facebook/g, '').trim(),
      author: {
        name: 'Facebook Video',
        username: '',
        avatar: 'https://static.xx.fbcdn.net/rsrc.php/v3/yD/r/5D8s-GsHJLe.png'
      },
      cover,
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Facebook: ${error.message}`);
  }
}

module.exports = { extractFacebook };
