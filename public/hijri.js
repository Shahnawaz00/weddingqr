// ════════════════════════════════════════════════════════════════
//  Gregorian → Hijri (Tabular Islamic / Kuwaiti algorithm)
//
//  Returns { day, month, year, monthName }.
//  The tabular calendar can be off by ±1 day vs. the official
//  moon-sighting announcement. Override via WEDDING_CONFIG.hijriDate
//  if you need an exact pinned string.
// ════════════════════════════════════════════════════════════════
(function () {
  const MONTHS = [
    "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhul-Qa'dah", "Dhul-Hijjah"
  ];

  function gregorianToHijri(g) {
    if (!(g instanceof Date) || isNaN(g.getTime())) return null;

    const day = g.getDate();
    const month = g.getMonth() + 1;
    const year = g.getFullYear();

    // Gregorian date → Julian Day Number
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jd =
      day + Math.floor((153 * m + 2) / 5) + 365 * y +
      Math.floor(y / 4) - Math.floor(y / 100) +
      Math.floor(y / 400) - 32045;

    // Kuwaiti tabular Islamic algorithm
    const l1 = jd - 1948440 + 10632;
    const n = Math.floor((l1 - 1) / 10631);
    const l2 = l1 - 10631 * n + 354;
    const j =
      Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
      Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 =
      l2 -
      Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
      29;
    const hMonth = Math.floor((24 * l3) / 709);
    const hDay = l3 - Math.floor((709 * hMonth) / 24);
    const hYear = 30 * n + j - 30;

    return {
      day: hDay,
      month: hMonth,
      year: hYear,
      monthName: MONTHS[Math.max(0, Math.min(11, hMonth - 1))],
    };
  }

  // Format like "1 RABI' AL-AWWAL 1448 AH"
  function formatHijri(g) {
    const h = gregorianToHijri(g);
    if (!h) return '';
    return `${h.day} ${h.monthName} ${h.year} AH`.toUpperCase();
  }

  window.Hijri = { gregorianToHijri, formatHijri };
})();
