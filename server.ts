import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for all media/API requests
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

const cache = new Map<string, { time: number; data: unknown }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 mins

const UPSTREAM_BASE = 'https://vidya.studybeepro.site';

// API: Batches list (supports both /api/batches and /batches.json)
app.get(['/api/batches', '/batches.json'], async (_req: Request, res: Response) => {
  try {
    const localFile = path.join(__dirname, 'src/data/batches.json');
    if (fs.existsSync(localFile)) {
      const data = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      return res.json(data);
    }
    const upstreamRes = await fetch(`${UPSTREAM_BASE}/batches.json`);
    if (!upstreamRes.ok) throw new Error('Upstream failed');
    const json = await upstreamRes.json();
    return res.json(json);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error fetching batches:', error.message);
    res.status(500).json({ error: 'Failed to fetch batches', message: error.message });
  }
});

// API: Folder contents (Lectures, Chapters, Subjects, Notes)
app.get(['/api/folder_contents', '/get/folder_contentsv3'], async (req: Request, res: Response) => {
  const courseId = (req.query.course_id as string) || (req.query.id as string);
  const parentId = (req.query.parent_id as string) || '-1';
  const start = (req.query.start as string) || '0';

  if (!courseId) {
    return res.status(400).json({ error: 'course_id is required' });
  }

  const cacheKey = `folder_${courseId}_${parentId}_${start}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const targetUrl = `${UPSTREAM_BASE}/get/folder_contentsv3?course_id=${encodeURIComponent(courseId)}&parent_id=${encodeURIComponent(parentId)}&start=${encodeURIComponent(start)}`;
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${UPSTREAM_BASE}/`,
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!upstream.ok) {
      throw new Error(`Upstream returned ${upstream.status}`);
    }

    const data = await upstream.json();
    cache.set(cacheKey, { time: Date.now(), data });
    return res.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in folder_contents:', error.message);
    res.status(500).json({ status: 500, message: error.message, data: [] });
  }
});

// API: Video Details
app.get(['/api/video_details', '/get/fetchVideoDetailsById'], async (req: Request, res: Response) => {
  const courseId = req.query.course_id as string;
  const videoId = req.query.video_id as string;

  if (!courseId || !videoId) {
    return res.status(400).json({ error: 'course_id and video_id are required' });
  }

  const cacheKey = `video_${courseId}_${videoId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const targetUrl = `${UPSTREAM_BASE}/get/fetchVideoDetailsById?course_id=${encodeURIComponent(courseId)}&video_id=${encodeURIComponent(videoId)}`;
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${UPSTREAM_BASE}/`,
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!upstream.ok) {
      throw new Error(`Upstream returned ${upstream.status}`);
    }

    const data = await upstream.json();
    cache.set(cacheKey, { time: Date.now(), data });
    return res.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in video_details:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Proxy PDF / Notes with full binary streaming
app.get(['/api/pdf_proxy', '/pdf'], async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    // 1. Try upstream proxy first
    const upstreamProxyUrl = `${UPSTREAM_BASE}/pdf?url=${encodeURIComponent(rawUrl)}`;
    let response = await fetch(upstreamProxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `${UPSTREAM_BASE}/`
      }
    });

    // 2. Fallback direct fetch
    if (!response.ok) {
      response = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `${UPSTREAM_BASE}/`
        }
      });
    }

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch PDF: ${response.statusText}`);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="gb_study_notes.pdf"');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.end(buffer);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in pdf proxy:', error.message);
    res.status(500).send(`Error fetching PDF: ${error.message}`);
  }
});

// API: Video & Segment Proxy (CRITICAL: supports both /video and /api/video_proxy)
app.get(['/video', '/api/video_proxy'], async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    // Forward Range header if client requested range
    const clientHeaders: Record<string, string> = {
      'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${UPSTREAM_BASE}/`
    };
    if (req.headers.range) {
      clientHeaders.Range = req.headers.range as string;
    }

    const upstreamProxyUrl = `${UPSTREAM_BASE}/video?url=${encodeURIComponent(rawUrl)}`;
    let response = await fetch(upstreamProxyUrl, { headers: clientHeaders });

    // Fallback: direct fetch if upstream proxy returned error
    if (!response.ok) {
      response = await fetch(rawUrl, { headers: clientHeaders });
    }

    if (!response.ok) {
      return res.status(response.status).send('Video stream error');
    }

    const ct = response.headers.get('content-type') || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');

    // Is it an M3U8 Playlist?
    const isPlaylist = ct.includes('mpegurl') || rawUrl.includes('.m3u8');
    if (isPlaylist) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      const bodyText = await response.text();
      // Ensure all segment and sub-playlist links route to /video?url=
      return res.send(bodyText);
    }

    // It is a binary .ts or .m4s or mp4 video chunk!
    // Stream exact binary buffer without character encoding corruption!
    res.setHeader('Content-Type', ct || 'video/mp2t');
    if (response.headers.get('content-range')) {
      res.setHeader('Content-Range', response.headers.get('content-range')!);
      res.status(206);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Length', buffer.length.toString());
    return res.end(buffer);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in video proxy:', error.message);
    res.status(500).send('Stream proxy failure');
  }
});

// API: MPD DASH stream proxy
app.get('/mpd', async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) return res.status(400).send('Missing url');

  try {
    const upstreamUrl = `${UPSTREAM_BASE}/mpd?url=${encodeURIComponent(rawUrl)}`;
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `${UPSTREAM_BASE}/`
      }
    });

    if (!response.ok) return res.status(response.status).send('MPD error');

    const ct = response.headers.get('content-type') || 'application/dash+xml';
    res.setHeader('Content-Type', ct);
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in mpd proxy:', error.message);
    res.status(500).send('MPD failure');
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GB STUDY server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
