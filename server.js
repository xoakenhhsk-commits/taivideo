const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { analyzeUrl } = require('./extractors');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper: Safely format Content-Disposition without ERR_INVALID_CHAR on Unicode titles
function getSafeContentDisposition(rawFilename) {
  const cleanName = (rawFilename || 'download.mp4').replace(/[\\/:*?"<>|]/g, '_');
  const asciiFallback = cleanName.replace(/[^\x20-\x7E]/g, '_');
  const utf8Encoded = encodeURIComponent(cleanName);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(process.cwd(), 'public')));

// Google Search Console Verification & SEO Files
app.get('/google8bc5f504709b8e3b.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google8bc5f504709b8e3b.html');
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n\nSitemap: https://taivideo-alpha.vercel.app/sitemap.xml\n');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://taivideo-alpha.vercel.app/</loc>\n    <lastmod>2026-08-24</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n');
});

// Supported platforms list with metadata
const SUPPORTED_PLATFORMS = [
  {
    id: 'douyin',
    name: 'Douyin (抖音)',
    icon: 'fa-brands fa-tiktok',
    color: '#00f2fe',
    badge: '1080p No Watermark',
    features: ['Video HD không logo', 'Album ảnh slide gốc', 'Nhạc nền MP3'],
    placeholder: 'https://v.douyin.com/... hoặc dán đoạn share từ Douyin'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'fa-brands fa-tiktok',
    color: '#fe2c55',
    badge: 'HD No Watermark',
    features: ['Video MP4 không logo', 'Trích xuất MP3', 'Tải ảnh bìa HD'],
    placeholder: 'https://vt.tiktok.com/... hoặc https://www.tiktok.com/@user/video/...'
  },
  {
    id: 'youtube',
    name: 'YouTube & Shorts',
    icon: 'fa-brands fa-youtube',
    color: '#ff0000',
    badge: '1080p / MP3 320k',
    features: ['YouTube Video & Shorts', 'Audio MP3 chất lượng cao', 'Thumbnail MaxRes HD'],
    placeholder: 'https://www.youtube.com/watch?v=... hoặc https://youtu.be/...'
  },
  {
    id: 'facebook',
    name: 'Facebook & Reels',
    icon: 'fa-brands fa-facebook',
    color: '#1877f2',
    badge: 'HD / SD Video',
    features: ['Facebook Video HD', 'Facebook Reels', 'Tải trực tiếp'],
    placeholder: 'https://www.facebook.com/reel/... hoặc link video Facebook'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'fa-brands fa-instagram',
    color: '#e1306c',
    badge: 'Reels / Posts',
    features: ['Instagram Reels HD', 'Post ảnh / Album', 'Không cần đăng nhập'],
    placeholder: 'https://www.instagram.com/reel/... hoặc https://www.instagram.com/p/...'
  },
  {
    id: 'generic',
    name: 'X / Twitter, Threads & Khác',
    icon: 'fa-solid fa-globe',
    color: '#1da1f2',
    badge: 'Multi-Format',
    features: ['Twitter/X Video', 'Threads Video', 'Bilibili, CapCut'],
    placeholder: 'Dán đường link bất kỳ để phân tích'
  }
];

// Sample demo links for quick test in UI
const DEMO_LINKS = [
  {
    platform: 'youtube',
    label: 'YouTube Demo',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    platform: 'tiktok',
    label: 'TikTok Trend (Demo)',
    url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173'
  },
  {
    platform: 'douyin',
    label: 'Douyin Video (Demo)',
    url: 'https://www.douyin.com'
  }
];

// API: Get platforms info
app.get('/api/platforms', (req, res) => {
  res.json({
    success: true,
    platforms: SUPPORTED_PLATFORMS,
    demos: DEMO_LINKS
  });
});

// Friendly GET handler for /api/analyze so browser visitors don't see "Cannot GET /api/analyze"
app.get('/api/analyze', (req, res) => {
  if (req.query.url) {
    return analyzeUrl(req.query.url)
      .then(result => res.json({ success: true, data: result }))
      .catch(err => res.status(500).json({ success: false, message: err.message }));
  }
  res.redirect('/');
});

// API: Analyze media URL (POST method used by UI)
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đường link cần tải.'
      });
    }

    const result = await analyzeUrl(url);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể xử lý đường link này. Vui lòng thử lại.'
    });
  }
});

// API: Stream Direct YT-DLP with GUARANTEED AAC AUDIO & H.264 VIDEO
app.get('/api/stream-ytdl', (req, res) => {
  const targetUrl = req.query.url;
  const ext = req.query.ext || 'mp4';
  const filename = req.query.filename || `download.${ext}`;
  const isAudio = ext === 'mp3' || ext === 'm4a';

  if (!targetUrl) {
    return res.status(400).send('Missing target URL');
  }

  const tempFile = path.join(os.tmpdir(), `omnifetch_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);

  const args = [
    '--remote-components', 'ejs:github',
    '--js-runtimes', 'node:node',
    '--ffmpeg-location', ffmpegPath,
    '-o', tempFile
  ];

  if (isAudio) {
    // High quality audio conversion to MP3
    args.push(
      '-f', 'ba/b',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0'
    );
  } else {
    // Full HD Video + AAC Audio merge (Ensures background music & audio always plays!)
    args.push(
      '-f', 'bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b',
      '--merge-output-format', 'mp4',
      '--postprocessor-args', 'ffmpeg:-c:v copy -c:a aac -b:a 192k'
    );
  }

  args.push(targetUrl);

  const proc = spawn('yt-dlp', args);

  proc.stderr.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('ERROR:')) {
      console.error('yt-dlp error:', msg);
    }
  });

  proc.on('close', (code) => {
    // Check if tempFile exists or with .mp3 extension if converted
    let finalFile = tempFile;
    if (!fs.existsSync(finalFile) && isAudio) {
      const mp3File = tempFile.replace(/\.[^/.]+$/, '.mp3');
      if (fs.existsSync(mp3File)) finalFile = mp3File;
    }

    if (code !== 0 || !fs.existsSync(finalFile)) {
      if (!res.headersSent) {
        return res.status(500).send('Không thể xử lý video/âm thanh. Vui lòng thử lại.');
      }
      return;
    }

    try {
      const stats = fs.statSync(finalFile);
      res.setHeader('Content-Disposition', getSafeContentDisposition(filename));
      res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
      res.setHeader('Content-Length', stats.size);

      const readStream = fs.createReadStream(finalFile);
      readStream.pipe(res);

      readStream.on('close', () => {
        try { fs.unlinkSync(finalFile); } catch (e) {}
      });
    } catch (err) {
      try { fs.unlinkSync(finalFile); } catch (e) {}
      if (!res.headersSent) res.status(500).send(err.message);
    }
  });

  req.on('close', () => {
    proc.kill();
    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
  });
});

// API: Unified Proxy Download (Douyin, TikTok, Instagram, Direct Video URLs, Images)
app.get('/api/proxy-download', async (req, res) => {
  try {
    let mediaUrl = req.query.url;
    const filename = req.query.filename || 'download.mp4';

    if (!mediaUrl) {
      return res.status(400).send('Missing media URL');
    }

    // Remote server stream (Douyin, TikTok, Instagram, Images)
    const response = await axios({
      method: 'GET',
      url: mediaUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': mediaUrl.includes('douyin') ? 'https://www.douyin.com/' : (mediaUrl.includes('tiktok') ? 'https://www.tiktok.com/' : '')
      },
      timeout: 30000
    });

    res.setHeader('Content-Disposition', getSafeContentDisposition(filename));
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error) {
    res.status(500).send(`Lỗi tải xuống trực tiếp: ${error.message}`);
  }
});

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 OmniFetch Downloader Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;

