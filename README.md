# Wedding photo collection site

A simple, elegant site for guests to share photos and videos. They scan a QR code, choose files, pick which event the photos are from, and tap upload.

## Quick start (local)

```sh
npm install
npm start
```

Open http://localhost:3000. With no env vars, uploads land in `./uploads/<event>/`.

## Customise

Edit `public/config.js` — names, date, venue, hashtag, tagline, **and the events list** (Mehndi / Nikkah / Walima / etc). That's the only file you need to touch for personalisation.

Set `events: []` to hide the event picker entirely; everything will go into `general/`.

## Deploy with Cloudflare R2 (recommended)

1. **Create the bucket** — Cloudflare dashboard → R2 → "Create bucket" (e.g. `wedding-photos`).
2. **Make it public** — bucket → Settings → "Public access" → enable r2.dev (one click) *or* attach a custom domain like `photos.yoursite.com`. Note the public URL.
3. **Create an API token** — R2 → "Manage R2 API Tokens" → "Create API token" → "Object Read & Write" scoped to the bucket. Save the Access Key ID + Secret Access Key.
4. **Set env vars on your host** (Render / Railway / Fly / wherever):

   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=wedding-photos
   R2_PUBLIC_URL=https://pub-xxxx.r2.dev   # or your custom domain
   ```

5. `npm start` — server logs the active backend on boot.

The Node app is tiny and stateless once R2 is configured. Any host that runs Node 18+ works (Render free, Railway, Fly, a $5 VPS).

### Pulling the photos to your laptop afterward

```sh
# install rclone, then once:
rclone config   # add a remote called "wedding" pointing at R2

# then any time:
rclone sync wedding:wedding-photos ~/WeddingPhotos
```

R2 has free egress, so this is free no matter how many GB.

## The QR code

Visit `/qr.html` on your **deployed** URL — it generates a QR pointing at `<that-host>/upload.html`. Hit "Print this card" to print it out for tables. (Generating the QR on localhost only works on your local network.)

## Pages

| Path             | What it is                                  |
|------------------|---------------------------------------------|
| `/`              | Landing page (couple's names, date, venue)  |
| `/upload.html`   | Where the QR code points — guests upload here |
| `/gallery.html`  | Browse everything, filter by event          |
| `/qr.html`       | Printable QR code card                      |

## API

- `POST /api/upload` — multipart form: `files` (multiple), optional `sender`, optional `event` slug.
- `GET  /api/photos` — JSON list of uploaded files (newest first), tagged with `event`.

## Limits

- 100 MB per file
- 30 files per upload request
- Images & videos only

## Storage layout

Files are keyed `<event-slug>/<timestamp>_<rand>_<sender>.<ext>` — both on R2 and on local disk. So you can sort, filter, and bulk-move by event prefix anywhere.
