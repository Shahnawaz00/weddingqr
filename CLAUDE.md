# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-purpose photo-collection site for a wedding. Guests scan a QR code, land on an upload page, optionally tag which event (Mehndi / Nikkah / Walima / …) the photos are from, and post. There's also a public gallery with event filters. No auth, no database, no build step.

## Commands

```sh
npm install      # one-time
npm start        # runs server.js on http://localhost:3000 (PORT env var to change)
```

There are no tests, linter, or build pipeline. The frontend is plain HTML + vanilla JS served statically — changes go live on browser refresh.

## Architecture

Three layers, all in one process:

1. **`server.js`** — Express + multer (memory storage). Two endpoints: `POST /api/upload` (multipart, fields: `files`, optional `sender`, optional `event`) and `GET /api/photos` (lists from the active backend). Delegates persistence to `storage.js`.
2. **`storage.js`** — storage abstraction with two backends. **Picks R2 if `R2_BUCKET` is set, else local disk.** Both expose the same `kind`, `save(buf, meta)`, `list()` surface. Storage keys are always `<event-slug>/<timestamp>_<rand>_<sender>.<ext>` regardless of backend, so anything that walks the listing (gallery filter, future migration scripts) works the same way against R2 or `./uploads/`.
3. **`public/`** — static frontend. Four pages (`index`, `upload`, `gallery`, `qr`) sharing `style.css` and `config.js`. No framework, no bundler.

### `public/config.js` is the only customisation point

Single source of truth for couple-specific text **and the event/album list**. Every page reads from `window.WEDDING_CONFIG`. **When asked to "change names", "update date", "add another event", or "rename the Walima album" — edit this file.** Do not duplicate values into HTML.

`events: []` means hide the picker; everything routes to `general/`.

### Storage backends

- **Local** — `./uploads/<event>/<file>`, served by Express at `/uploads/*`. Used when no `R2_BUCKET` env var. Convenient for dev, fragile for prod (ephemeral disks lose data).
- **R2** — Cloudflare R2 (S3-compatible). Configured via `R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL`. Public URLs are served straight from R2 (no proxying through our server).

When adding a new backend (S3, Cloudinary, Google Cloud Storage), implement the same `{ kind, save, list }` shape inside `storage.js` and add the selection branch at the bottom. Do **not** scatter cloud SDK calls across `server.js`.

### How the QR code works

`qr.html` generates the QR client-side using the `qrcode` CDN script and encodes `${window.location.origin}/upload.html`. So the QR is correct for whatever host the page is loaded from — **generate it after deployment, not from localhost.**

### Design system

CSS variables at the top of `style.css`: `--ivory`, `--emerald`, `--gold`, `--charcoal`. Fonts: Cormorant Garamond (serif/display), Inter (sans/UI), Amiri (Arabic Bismillah). The subtle 8-point-star pattern in the body background is an inline SVG data-URI in `body { background-image }`. Keep new UI consistent with these tokens rather than adding ad-hoc colours.

The Bismillah (`بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ`) appears on the landing and QR pages — this is a Muslim wedding site, treat that text carefully if asked to edit it.

## Things to be careful about

- **No DB.** "Saving" anything new (RSVPs, comments, captions, per-photo metadata) means picking real storage or writing JSON files with all the failure modes that implies — flag the trade-off before just doing it. Right now metadata is encoded into filenames (timestamp/sender/event), which is enough for this app and *not* a pattern to extend further.
- **No auth.** The gallery and upload endpoint are public to anyone with the URL. Moderation / private gallery / admin views are real features, not tweaks.
- **Mobile-first.** Guests will use this on phones at the venue. The upload page in particular needs to work one-handed.
- **The bucket / `uploads/` folder is the data.** Don't suggest `rm -rf` or "clear the bucket" casually. Anything destructive must be confirmed with the user.
- **Field order in the upload form matters.** Multer streams in declared order; non-file fields (`sender`, `event`) must be appended to `FormData` before `files`. `upload.html` already does this — preserve the ordering if you refactor.
- **Filename callback vs. memory storage.** `server.js` uses `multer.memoryStorage()` and key construction lives in `storage.buildKey`. Don't move key construction back into multer's `filename` callback — it splits the logic across backends.
