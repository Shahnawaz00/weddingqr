// ════════════════════════════════════════════════════════════════
//  Universe system — each universe is its own complete stylesheet
//  in /themes/. We swap the link[id="universe"] href to switch.
//  Runs synchronously in <head> so the right universe loads before
//  first paint (no FOUC). Wires the picker on DOMContentLoaded.
//
//  Universes:
//    cinema      — default; ink + ember + bone, monumental serif
//    editorial   — off-white + mulberry, magazine spread
//    manuscript  — cream + lapis + gold leaf + vermillion, illuminated
//    garden      — cream + sage + blush, pressed-flower journal
// ════════════════════════════════════════════════════════════════
(function () {
  const KEY = 'izzywedding-universe';
  const DEFAULT = 'cinema';
  // All 4 universes are slotted in the picker. AVAILABLE is the subset
  // that has a real stylesheet shipped — the rest are disabled in the
  // picker until they land in follow-up commits.
  const UNIVERSES = ['cinema', 'editorial', 'manuscript', 'garden'];
  const AVAILABLE = ['cinema', 'editorial', 'manuscript'];
  const NAMES = {
    cinema:     'Cinema',
    editorial:  'Editorial',
    manuscript: 'Manuscript',
    garden:     'Garden',
  };

  const urlUniverse = new URLSearchParams(location.search).get('theme')
                   || new URLSearchParams(location.search).get('universe');
  const stored = localStorage.getItem(KEY);
  const initialRaw = (urlUniverse && AVAILABLE.includes(urlUniverse))
    ? urlUniverse
    : (stored && AVAILABLE.includes(stored) ? stored : DEFAULT);
  const initial = initialRaw;

  // Patch the universe stylesheet href before first paint
  const setUniverse = (name) => {
    if (!UNIVERSES.includes(name)) name = DEFAULT;
    document.documentElement.setAttribute('data-universe', name);
    const link = document.getElementById('universe');
    if (link) {
      const desired = `/themes/${name}.css`;
      if (!link.getAttribute('href').endsWith(`/themes/${name}.css`)) {
        link.setAttribute('href', desired);
      }
    }
  };
  setUniverse(initial);
  if (urlUniverse) localStorage.setItem(KEY, initial);

  function applyUniverse(name) {
    if (!AVAILABLE.includes(name)) return;     // ignore clicks on unbuilt universes
    const apply = () => {
      setUniverse(name);
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
    const current = localStorage.getItem(KEY) || DEFAULT;
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
        btn.title = `${NAMES[name]} — coming soon`;
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
