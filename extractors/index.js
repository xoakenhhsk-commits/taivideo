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
    throw new Error('Vui lòng nhập đường link hợp lệ.');
  }

  const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) {
    throw new Error('Không tìm thấy đường link URL hợp lệ trong nội dung bạn nhập.');
  }

  const url = urlMatch[0];

  // Detect Douyin
  if (/douyin\.com|iesdouyin\.com|v\.douyin\.com/i.test(url)) {
    return await extractDouyin(url);
  }

  // Detect TikTok
  if (/tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/i.test(url)) {
    return await extractTikTok(url);
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
