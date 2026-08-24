const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Xiaohongshu (小红书 / RedNote) Video & Image Album Extractor
 */
async function extractXiaohongshu(rawInput) {
  try {
    if (!rawInput || typeof rawInput !== 'string') {
      throw new Error('Vui lòng nhập đường link hoặc đoạn chia sẻ Tiểu Hồng Thư (小红书) hợp lệ.');
    }

    // 1. Clean URL from Chinese text
    const match = rawInput.match(/(https?:\/\/[a-zA-Z0-9.\-_/]*(?:xiaohongshu\.com|xhslink\.com)\/[a-zA-Z0-9._\-\/?=&%]+)/i) ||
                  rawInput.match(/https?:\/\/[^\s\u4e00-\u9fa5]+/);
    let cleanUrl = match ? match[0] : rawInput.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    let title = 'Tiểu Hồng Thư (小红书) Media Post';
    let cover = 'https://fe-static.xhscdn.com/static-sites/fe-platform/favicon.ico';
    let directVideo = null;
    const images = [];

    // Follow redirect for xhslink.com
    let resolvedUrl = cleanUrl;
    try {
      const res = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        maxRedirects: 10,
        timeout: 9000,
        validateStatus: () => true
      });

      if (res.request?.res?.responseUrl) {
        resolvedUrl = res.request.res.responseUrl;
      }

      const html = res.data;
      if (typeof html === 'string') {
        const $ = cheerio.load(html);
        title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="title"]').attr('content') ||
                $('title').text() || title;

        cover = $('meta[property="og:image"]').attr('content') || cover;
        directVideo = $('meta[property="og:video"]').attr('content') || null;

        // Try extracting __INITIAL_STATE__
        const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});?<\/script>/s);
        if (stateMatch) {
          try {
            const state = JSON.parse(stateMatch[1].replace(/undefined/g, 'null'));
            const noteMap = state.note?.noteDetailMap || {};
            const noteId = Object.keys(noteMap)[0] || state.note?.currentNoteId;
            const note = noteId ? noteMap[noteId]?.note : null;

            if (note) {
              title = note.title || note.desc || title;
              if (note.user?.nickname) {
                title = `[${note.user.nickname}] ${title}`;
              }
              if (note.video?.media?.stream?.h264?.[0]?.masterUrl) {
                directVideo = note.video.media.stream.h264[0].masterUrl;
              }
              if (Array.isArray(note.imageList) && note.imageList.length > 0) {
                note.imageList.forEach(img => {
                  const imgUrl = img.urlDefault || img.url || img.urlPre;
                  if (imgUrl) images.push(imgUrl);
                });
              }
            }
          } catch (jsonErr) {
            // Ignore JSON parse err
          }
        }
      }
    } catch (fetchErr) {
      console.warn('Xiaohongshu scrape warning:', fetchErr.message);
    }

    const downloads = [];

    // 1. Direct Video Stream if found
    if (directVideo) {
      downloads.push({
        type: 'video',
        label: 'Tải Video Tiểu Hồng Thư HD (Không Logo)',
        quality: '1080p Full HD',
        url: directVideo,
        ext: 'mp4',
        badge: 'Direct HD'
      });
    }

    // 2. Direct Photo Album if found
    if (images.length > 0) {
      downloads.push({
        type: 'album',
        label: `Bộ sưu tập ảnh Tiểu Hồng Thư (${images.length} ảnh gốc HD)`,
        quality: 'Original HD',
        images
      });
    }

    // 3. Fast Web Gateways for Xiaohongshu
    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng DLPanda (Tiểu Hồng Thư / RedNote HD)',
      quality: '1080p Full HD',
      url: `https://dlpanda.com/xhs?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'DLPanda HD'
    });

    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng RedNote Tools (Không Logo / Ảnh HD)',
      quality: 'HD Stream',
      url: `https://rednote.tools/?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'RedNote'
    });

    downloads.push({
      type: 'video',
      label: 'Tải qua Cổng SnapSave (RedNote / XHS)',
      quality: 'Full HD',
      url: `https://snapsave.app/vn?url=${encodeURIComponent(cleanUrl)}`,
      isExternal: true,
      ext: 'mp4',
      badge: 'SnapSave'
    });

    // 4. Cover image
    if (cover && cover.startsWith('http')) {
      downloads.push({
        type: 'image',
        label: 'Tải Ảnh Bìa / Thumbnail Tiểu Hồng Thư',
        quality: 'Cover HD',
        url: cover,
        ext: 'jpg',
        badge: 'Cover'
      });
    }

    return {
      platform: 'xiaohongshu',
      title: title.replace(/小红书/g, '').replace(/[-_|]/g, ' ').trim() || 'Tiểu Hồng Thư Media (小红书)',
      author: {
        name: 'Tác giả Tiểu Hồng Thư (小红书)',
        username: '',
        avatar: 'https://fe-static.xhscdn.com/static-sites/fe-platform/favicon.ico'
      },
      cover,
      duration: 0,
      stats: { likes: 0, views: 0 },
      downloads
    };
  } catch (error) {
    throw new Error(`Lỗi phân tích Tiểu Hồng Thư: ${error.message}`);
  }
}

module.exports = { extractXiaohongshu };
