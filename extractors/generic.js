const axios = require('axios');

/**
 * Generic & Multi-Platform Extractor (Twitter/X, Threads, Pinterest, etc.)
 */
async function extractGeneric(url) {
  try {
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : url;

    // Detect generic platform name
    let platform = 'generic';
    let labelPrefix = 'Video';

    if (/twitter\.com|x\.com/.test(cleanUrl)) {
      platform = 'twitter';
      labelPrefix = 'Twitter / X';
    } else if (/threads\.net/.test(cleanUrl)) {
      platform = 'threads';
      labelPrefix = 'Threads';
    } else if (/pinterest\.com|pin\.it/.test(cleanUrl)) {
      platform = 'pinterest';
      labelPrefix = 'Pinterest';
    } else if (/bilibili\.com|b23\.tv/.test(cleanUrl)) {
      platform = 'bilibili';
      labelPrefix = 'Bilibili (B站)';
    } else if (/capcut\.com/.test(cleanUrl)) {
      platform = 'capcut';
      labelPrefix = 'CapCut';
    }

    const downloads = [];

    // Try Cobalt API
    try {
      const cobaltRes = await axios.post(
        'https://api.cobalt.tools/api/json',
        {
          url: cleanUrl,
          vQuality: '1080'
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 8000
        }
      );

      if (cobaltRes.data && cobaltRes.data.url) {
        downloads.push({
          type: 'video',
          label: `${labelPrefix} Video HD`,
          quality: 'HD Stream',
          url: cobaltRes.data.url,
          ext: 'mp4',
          badge: 'HD Quality'
        });
      }
    } catch {
      // Fallback
    }

    return {
      platform,
      title: `${labelPrefix} Media Post`,
      author: {
        name: `${labelPrefix} Creator`,
        username: '',
        avatar: ''
      },
      cover: '',
      duration: 0,
      stats: {
        likes: 0,
        views: 0
      },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích link: ${error.message}`);
  }
}

module.exports = { extractGeneric };
