// ════════════════════════════════════════════════════════════════
//  Theme system — 4 alternates + persistent selection.
//  All pages include this script. Landing page also renders a
//  picker (if .theme-picker exists in the DOM).
// ════════════════════════════════════════════════════════════════
(function () {
  const KEY = 'izzywedding-theme';
  // URL ?theme=… wins over localStorage (handy for previews + screenshots).
  const urlTheme = new URLSearchParams(location.search).get('theme');
  const stored = urlTheme || localStorage.getItem(KEY) || 'default';

  // Apply BEFORE first paint: set on <html> immediately.
  if (stored && stored !== 'default') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  // Persist URL-sourced theme so it carries to other pages
  if (urlTheme) localStorage.setItem(KEY, urlTheme);

  function applyTheme(theme) {
    if (!theme || theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(KEY);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(KEY, theme);
    }
  }

  function wirePicker() {
    const picker = document.querySelector('.theme-picker');
    if (!picker) return;
    const current = localStorage.getItem(KEY) || 'default';
    const buttons = picker.querySelectorAll('.theme-swatch');
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
