// ════════════════════════════════════════════════════════════════
//  Cloudflare Pages Function — GET /api/photos
//
//  Lists every object in the bound R2 bucket, newest first, in the
//  shape the gallery expects: { ok, photos: [{ key, url, isVideo,
//  mtime, event }] }. Mirrors GET /api/photos in /server.js.
//
//  Bindings: R2 bucket → MEDIA, env var → R2_PUBLIC_URL.
// ════════════════════════════════════════════════════════════════

const VIDEO_RE = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

export async function onRequestGet({ env }) {
  try {
    if (!env.MEDIA) {
      return Response.json({ ok: false, error: 'R2 bucket not bound (MEDIA)' }, { status: 500 });
    }
    const publicBase = (env.R2_PUBLIC_URL || '').replace(/\/+$/, '');

    const out = [];
    let cursor;
    do {
      const listed = await env.MEDIA.list({ cursor, limit: 1000 });
      for (const obj of listed.objects) {
        out.push({
          key: obj.key,
          url: `${publicBase}/${obj.key}`,
          isVideo: VIDEO_RE.test(obj.key),
          mtime: obj.uploaded ? new Date(obj.uploaded).getTime() : 0,
          event: obj.key.split('/')[0] || 'general',
        });
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    out.sort((a, b) => b.mtime - a.mtime);
    return Response.json({ ok: true, photos: out });
  } catch (err) {
    return Response.json({ ok: false, error: (err && err.message) || 'list_failed' }, { status: 400 });
  }
}
