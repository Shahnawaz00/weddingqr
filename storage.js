// ════════════════════════════════════════════════════════════════
//  Storage abstraction.
//
//  Two backends:
//    - R2 (Cloudflare object storage, S3-compatible) — production
//    - Local disk (./uploads/<event>/<file>)         — development
//
//  Picks R2 if R2_BUCKET env var is set, else local. So `npm start`
//  works with no config; deployments set R2_* vars.
//
//  Public surface:
//    storage.kind             → 'r2' | 'local'
//    storage.save(buf, meta)  → { key, url }
//    storage.list()           → [{ key, url, isVideo, mtime, event }]
// ════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const VIDEO_RE = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

function buildKey({ event, originalName, sender }) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const ext = path.extname(originalName).toLowerCase();
  const safeSender = (sender || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24) || 'guest';
  const safeEvent = (event || 'general').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'general';
  return `${safeEvent}/${ts}_${rand}_${safeSender}${ext}`;
}

// ─── Local backend ──────────────────────────────────────────────
function localBackend() {
  const ROOT = path.join(__dirname, 'uploads');
  if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });

  return {
    kind: 'local',
    publicUrlBase: '/uploads',

    async save(buffer, meta) {
      const key = buildKey(meta);
      const full = path.join(ROOT, key);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      await fs.promises.writeFile(full, buffer);
      return { key, url: `/uploads/${key}` };
    },

    async list() {
      const out = [];
      const walk = (dir, prefix = '') => {
        for (const name of fs.readdirSync(dir)) {
          if (name.startsWith('.')) continue;
          const full = path.join(dir, name);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            walk(full, prefix ? `${prefix}/${name}` : name);
          } else {
            const key = prefix ? `${prefix}/${name}` : name;
            out.push({
              key,
              url: `/uploads/${key}`,
              isVideo: VIDEO_RE.test(name),
              mtime: stat.mtimeMs,
              event: prefix.split('/')[0] || 'general',
            });
          }
        }
      };
      walk(ROOT);
      return out.sort((a, b) => b.mtime - a.mtime);
    },

    serveStaticPath: ROOT,
  };
}

// ─── R2 backend ─────────────────────────────────────────────────
function r2Backend() {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
  } = process.env;

  const missing = [
    ['R2_ACCOUNT_ID', R2_ACCOUNT_ID],
    ['R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID],
    ['R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY],
    ['R2_BUCKET', R2_BUCKET],
    ['R2_PUBLIC_URL', R2_PUBLIC_URL],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    throw new Error(`R2 backend selected but missing env vars: ${missing.join(', ')}`);
  }

  const publicBase = R2_PUBLIC_URL.replace(/\/+$/, '');
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  return {
    kind: 'r2',
    publicUrlBase: publicBase,

    async save(buffer, meta) {
      const key = buildKey(meta);
      await client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: meta.mimetype || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      return { key, url: `${publicBase}/${key}` };
    },

    async list() {
      const out = [];
      let ContinuationToken;
      do {
        const resp = await client.send(new ListObjectsV2Command({
          Bucket: R2_BUCKET,
          ContinuationToken,
        }));
        for (const obj of resp.Contents || []) {
          if (!obj.Key) continue;
          out.push({
            key: obj.Key,
            url: `${publicBase}/${obj.Key}`,
            isVideo: VIDEO_RE.test(obj.Key),
            mtime: obj.LastModified ? new Date(obj.LastModified).getTime() : 0,
            event: obj.Key.split('/')[0] || 'general',
          });
        }
        ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
      } while (ContinuationToken);
      return out.sort((a, b) => b.mtime - a.mtime);
    },
  };
}

module.exports = process.env.R2_BUCKET ? r2Backend() : localBackend();
