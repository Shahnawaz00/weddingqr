// ════════════════════════════════════════════════════════════════
//  Universe system — three identities (cinema, manuscript, garden).
//
//  Initial universe selection happens via an inline script in each
//  HTML <head>: it sets data-universe on <html> and appends the
//  correct /themes/<name>.css link BEFORE any subsequent resource
//  loads. That eliminates the FOUC on cross-page navigation.
//
//  This file handles only runtime: wiring the picker, swapping the
//  active universe with a View-Transitions crossfade, persistence.
// ════════════════════════════════════════════════════════════════
(function () {
  const KEY = 'izzywedding-universe';
  const DEFAULT = 'manuscript';
  const UNIVERSES = ['cinema', 'manuscript', 'garden'];
  const AVAILABLE = ['cinema', 'manuscript', 'garden'];
  const NAMES = {
    cinema:     'Cinema',
    manuscript: 'Manuscript',
    garden:     'Garden',
  };

  function applyUniverse(name) {
    if (!AVAILABLE.includes(name)) return;
    const apply = () => {
      document.documentElement.setAttribute('data-universe', name);
      const link = document.getElementById('universe');
      const desired = '/themes/' + name + '.css';
      if (link) {
        if (!link.getAttribute('href').endsWith(desired)) {
          link.setAttribute('href', desired);
        }
      } else {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.id = 'universe';
        l.href = desired;
        document.head.appendChild(l);
      }
      localStorage.setItem(KEY, name);
      const nameEl = document.getElementById('themeName');
      if (nameEl) nameEl.textContent = NAMES[name];
      // If the guest hasn't set a custom palette, the new universe's
      // default --brand-* applies — re-sync the picker inputs to it.
      syncPaletteUI();
    };
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  }

  function wirePicker() {
    const picker = document.querySelector('.theme-picker');
    if (!picker) return;
    const current = (document.documentElement.getAttribute('data-universe')
                  || localStorage.getItem(KEY)
                  || DEFAULT);
    const buttons = picker.querySelectorAll('.theme-swatch');
    const nameEl = document.getElementById('themeName');
    if (nameEl) nameEl.textContent = NAMES[current] || '';
    buttons.forEach((btn) => {
      const name = btn.dataset.theme;
      const isAvailable = AVAILABLE.includes(name);
      btn.classList.toggle('is-active', name === current);
      btn.classList.toggle('is-disabled', !isAvailable);
      if (!isAvailable) {
        btn.setAttribute('aria-disabled', 'true');
        btn.title = `${NAMES[name] || name} — unavailable`;
      }
      btn.addEventListener('click', () => {
        if (!isAvailable) return;
        applyUniverse(name);
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });
  }

  // ────────────────────────────────────────────────────────────────
  //  Palette — two source colours (--brand-primary / --brand-secondary)
  //  that every universe derives all its shades from via color-mix.
  //  Setting them inline on <html> overrides each theme's :root default
  //  and persists across pages + universe switches.
  // ────────────────────────────────────────────────────────────────
  const PKEY = 'izzywedding-primary';
  const SKEY = 'izzywedding-secondary';
  // Orange-lover presets — all orange-led, spanning red-orange to
  // golden to earthy to refined so each lands differently per universe.
  const PRESETS = [
    { name: 'Sunset Blaze',  primary: '#e0701f', secondary: '#ffb24d' },
    { name: 'Blood Orange',  primary: '#e8431f', secondary: '#ff8a5c' },
    { name: 'Marigold',      primary: '#f2891b', secondary: '#ffc94d' },
    { name: 'Terracotta',    primary: '#c2531f', secondary: '#e6a06b' },
    { name: 'Tangerine Pop', primary: '#ff6a14', secondary: '#ffd07a' },
    { name: 'Copper Ember',  primary: '#b86a2e', secondary: '#e09a4f' },
  ];
  const HEX6 = /^#[0-9a-f]{6}$/i;

  function setBrand(primary, secondary, persist) {
    const root = document.documentElement;
    if (primary)   root.style.setProperty('--brand-primary', primary);
    if (secondary) root.style.setProperty('--brand-secondary', secondary);
    if (persist) {
      if (primary)   localStorage.setItem(PKEY, primary);
      if (secondary) localStorage.setItem(SKEY, secondary);
    }
    syncPaletteUI();
  }

  function clearBrand() {
    const root = document.documentElement;
    root.style.removeProperty('--brand-primary');
    root.style.removeProperty('--brand-secondary');
    localStorage.removeItem(PKEY);
    localStorage.removeItem(SKEY);
    syncPaletteUI();
  }

  function syncPaletteUI() {
    const cs = getComputedStyle(document.documentElement);
    const p = cs.getPropertyValue('--brand-primary').trim();
    const s = cs.getPropertyValue('--brand-secondary').trim();
    const pi = document.getElementById('primaryInput');
    const si = document.getElementById('secondaryInput');
    if (pi && HEX6.test(p)) pi.value = p;
    if (si && HEX6.test(s)) si.value = s;
  }

  function wirePalette() {
    const picker = document.querySelector('.palette-picker');
    if (!picker) return;

    // Restore a previously-saved custom palette (also done pre-paint in
    // the <head> bootstrap; repeated here so the picker works even if a
    // page lacks that snippet).
    const sp = localStorage.getItem(PKEY);
    const ss = localStorage.getItem(SKEY);
    if (sp || ss) setBrand(sp, ss, false);

    const presetWrap = document.getElementById('palettePresets');
    if (presetWrap) {
      PRESETS.forEach((preset) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'palette-preset';
        b.title = preset.name;
        b.setAttribute('aria-label', preset.name);
        b.style.setProperty('--pp', preset.primary);
        b.style.setProperty('--ps', preset.secondary);
        b.addEventListener('click', () => setBrand(preset.primary, preset.secondary, true));
        presetWrap.appendChild(b);
      });
    }

    const pi = document.getElementById('primaryInput');
    const si = document.getElementById('secondaryInput');
    if (pi) pi.addEventListener('input', (e) => setBrand(e.target.value, null, true));
    if (si) si.addEventListener('input', (e) => setBrand(null, e.target.value, true));
    const reset = document.getElementById('paletteReset');
    if (reset) reset.addEventListener('click', clearBrand);

    syncPaletteUI();
  }

  function init() {
    wirePicker();
    wirePalette();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
