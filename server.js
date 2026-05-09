require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');

const storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB per file
const MAX_FILES_PER_REQUEST = 30;

// In-memory upload — we re-emit to the configured backend (R2 or local).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES_PER_REQUEST },
  fileFilter: (_req, file, cb) => {
    if (/^(image|video)\//i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image and video files are allowed.'));
  },
});

app.use(express.static(path.join(__dirname, 'public')));

// Local backend: also serve uploads from disk so the gallery works.
if (storage.kind === 'local') {
  app.use('/uploads', express.static(storage.serveStaticPath, { maxAge: '1d' }));
}

app.post('/api/upload', upload.array('files', MAX_FILES_PER_REQUEST), async (req, res, next) => {
  try {
    const sender = req.body && req.body.sender;
    const event = req.body && req.body.event;
    const saved = [];
    for (const f of req.files || []) {
      const result = await storage.save(f.buffer, {
        originalName: f.originalname,
        mimetype: f.mimetype,
        sender,
        event,
      });
      saved.push({ name: result.key, size: f.size, url: result.url });
    }
    res.json({ ok: true, count: saved.length, files: saved });
  } catch (err) {
    next(err);
  }
});

app.get('/api/photos', async (_req, res, next) => {
  try {
    const photos = await storage.list();
    res.json({ ok: true, photos });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(400).json({ ok: false, error: err.message || 'request_failed' });
});

app.listen(PORT, () => {
  console.log(`\n  Wedding site running → http://localhost:${PORT}`);
  console.log(`  Storage backend      → ${storage.kind}${storage.kind === 'r2' ? ` (${storage.publicUrlBase})` : ''}\n`);
});
