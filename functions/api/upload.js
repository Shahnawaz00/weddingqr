// ════════════════════════════════════════════════════════════════
//  Cloudflare Pages Function — POST /api/upload
//
//  Multipart form: `files` (one or more), optional `sender`, `event`.
//  Stores each file in the bound R2 bucket (env.MEDIA) under
//  <event-slug>/<ts>_<rand>_<sender>.<ext> — the same key scheme the
//  gallery walks. Mirrors the Express endpoint in /server.js so local
//  dev (server.js + local disk) and production (Pages + R2) behave the
//  same.
//
//  Bindings expected (set in the Pages project → Settings → Functions):
//    • R2 bucket binding   → variable name  MEDIA
//    • Environment variable → R2_PUBLIC_URL  (the bucket's public URL)
// ════════════════════════════════════════════════════════════════

function buildKey(originalName, sender, event) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const dot = (originalName || '').lastIndexOf('.');
  const ext = dot >= 0 ? originalName.slice(dot).toLowerCase() : '';
  const safeSender = (sender || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24) || 'guest';
  const safeEvent = (event || 'general').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'general';
  return `${safeEvent}/${ts}_${rand}_${safeSender}${ext}`;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.MEDIA) {
      return Response.json({ ok: false, error: 'R2 bucket not bound (MEDIA)' }, { status: 500 });
    }
    const publicBase = (env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

    const form = await request.formData();
    const sender = form.get('sender') || '';
    const event = form.get('event') || '';
    // Files arrive as File (Blob) objects; ignore stray string fields.
    const files = form.getAll('files').filter(
      (f) => f && typeof f === 'object' && typeof f.arrayBuffer === 'function'
    );

    const saved = [];
    for (const file of files) {
      const type = file.type || '';
      if (!/^(image|video)\//i.test(type)) continue;        // images + videos only
      const key = buildKey(file.name, sender, event);
      // A File IS a Blob — R2 streams it without buffering the whole thing.
      await env.MEDIA.put(key, file, {
        httpMetadata: {
          contentType: type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      saved.push({ name: key, size: file.size, url: `${publicBase}/${key}` });
    }

    return Response.json({ ok: true, count: saved.length, files: saved });
  } catch (err) {
    return Response.json({ ok: false, error: (err && err.message) || 'upload_failed' }, { status: 400 });
  }
}
