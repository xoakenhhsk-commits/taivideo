const { extractTikTok } = require('./tiktok');
const { extractDouyin } = require('./douyin');
const { extractYouTube } = require('./youtube');
const { extractFacebook } = require('./facebook');
const { extractInstagram } = require('./instagram');
const { extractGeneric } = require('./generic');

/**
 * Identify platform and dispatch to the correct extractor
 */
async function analyzeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Vui lòng nhập đường link hoặc đoạn chia sẻ hợp lệ.');
  }

  // 1. Detect Douyin (Check full text for douyin domain before extracting URL)
  if (/douyin\.com|iesdouyin\.com|v\.douyin\.com/i.test(rawUrl)) {
    return await extractDouyin(rawUrl);
  }

  // 2. Extract standard URL for other platforms
  const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
  if (!urlMatch && !/tiktok|facebook|instagram|youtube|youtu\.be/i.test(rawUrl)) {
    throw new Error('Không tìm thấy đường link URL hợp lệ trong nội dung bạn nhập.');
  }

  const url = urlMatch ? urlMatch[0] : (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl.trim()}`);

  // Detect TikTok
  if (/tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/i.test(url) || /tiktok\.com/i.test(rawUrl)) {
    return await extractTikTok(rawUrl);
  }

  // Detect YouTube
  if (/youtube\.com|youtu\.be/i.test(url)) {
    return await extractYouTube(url);
  }

  // Detect Facebook
  if (/facebook\.com|fb\.watch|fb\.me/i.test(url)) {
    return await extractFacebook(url);
  }

  // Detect Instagram
  if (/instagram\.com|instagr\.am/i.test(url)) {
    return await extractInstagram(url);
  }

  // Generic / Other platforms
  return await extractGeneric(url);
}

module.exports = { analyzeUrl };
