// ════════════════════════════════════════════════════════════════
//  EDIT THIS FILE to customise the site for your wedding.
//  Every page reads from this one config object.
// ════════════════════════════════════════════════════════════════
window.WEDDING_CONFIG = {
  brideName: 'Izzati',
  groomName: 'Danial',
  date: '12 December 2026',
  venue: 'Melbourne',
  hashtag: '#IzzyAndDanial',

  // Optional welcome line shown under the names on the landing page.
  // tagline: 'We cannot wait to celebrate with you.',

  // Shown on the upload + QR pages. Keep it short — it goes on a card.
  uploadPrompt: 'Share your photos & videos with us',

  // ────────────────────────────────────────────────────────────
  //  Optional Jawi script for the names (off by default).
  //  When set, renders as a small Amiri line beneath the English
  //  names on the landing page and the QR card. Empty = hidden.
  //  Best-guess transliterations: 'إيزي' (Izzy), 'آدم' (Adam).
  // ────────────────────────────────────────────────────────────
  brideNameJawi: '',
  groomNameJawi: '',

  // ────────────────────────────────────────────────────────────
  //  Hijri date.
  //  Auto-computed from `date` above using the Tabular Islamic
  //  algorithm. The tabular calendar can be off by ±1 day vs. the
  //  official Mufti moon-sighting announcement. If you want to pin
  //  an exact spelling (e.g. Bahasa Malaysia: "1 Rabiulawal 1448"),
  //  set it here and it'll be used verbatim.
  // ────────────────────────────────────────────────────────────
  hijriDate: '3 Rajab 1448',  // e.g. '1 Rabiulawal 1448' to override auto-compute

  // ────────────────────────────────────────────────────────────
  //  Events / albums
  //  Guests pick one when they upload, so photos are pre-organised.
  //  Defaults below cover a typical Malay Muslim wedding — change
  //  to whatever events you have.
  //
  //  Set to [] to hide the picker (everything goes to "lain-lain").
  //  `slug` = storage folder name (lowercase, no spaces).
  //  `label` = what guests see.
  // ────────────────────────────────────────────────────────────
  events: [
    { slug: 'akad-nikah',  label: 'Akad Nikah'   },
    { slug: 'bersanding',  label: 'Bersanding'   },
    { slug: 'lain-lain',   label: 'Lain-lain'    },
  ],
};
