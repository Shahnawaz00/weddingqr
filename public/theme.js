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
  const DEFAULT = 'cinema';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wirePicker);
  } else {
    wirePicker();
  }
})();
