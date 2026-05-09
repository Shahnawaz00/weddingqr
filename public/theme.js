// ════════════════════════════════════════════════════════════════
//  Theme system — 4 distinct identities (colour, ornaments, border,
//  button silhouette), with persistence and a soft cross-fade on
//  swap so the page feels like it re-engraved itself, not flicked.
// ════════════════════════════════════════════════════════════════
(function () {
  const KEY = 'izzywedding-theme';
  const NAMES = {
    'default':  'Engraved Emerald',
    'midnight': 'Midnight Ivory',
    'rose':     'Mughal Rose',
    'bronze':   'Desert Bronze',
  };

  // URL ?theme=… wins over localStorage (handy for previews + screenshots).
  const urlTheme = new URLSearchParams(location.search).get('theme');
  const stored = urlTheme || localStorage.getItem(KEY) || 'default';

  if (stored && stored !== 'default') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  if (urlTheme) localStorage.setItem(KEY, urlTheme);

  function applyTheme(theme) {
    const root = document.documentElement;

    // Use View Transitions API for an animated crossfade if available.
    const swap = () => {
      if (!theme || theme === 'default') {
        root.removeAttribute('data-theme');
        localStorage.removeItem(KEY);
      } else {
        root.setAttribute('data-theme', theme);
        localStorage.setItem(KEY, theme);
      }
      const nameEl = document.getElementById('themeName');
      if (nameEl) nameEl.textContent = NAMES[theme || 'default'] || '';
    };

    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(swap);
    } else {
      swap();
    }
  }

  function wirePicker() {
    const picker = document.querySelector('.theme-picker');
    if (!picker) return;
    const current = localStorage.getItem(KEY) || 'default';
    const buttons = picker.querySelectorAll('.theme-swatch');
    const nameEl = document.getElementById('themeName');
    if (nameEl) nameEl.textContent = NAMES[current] || '';
    buttons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.theme === current);
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        applyTheme(theme);
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wirePicker);
  } else {
    wirePicker();
  }
})();
