export function initLangSync(bindings = []) {
  // Apply language settings to elements
  function apply(lang) {
    // 1. Process custom bindings
    bindings.forEach(({ elementId, selector, ta, en, attr }) => {
      const elements = selector ? document.querySelectorAll(selector) : [document.getElementById(elementId)];
      elements.forEach(el => {
        if (el) {
          if (attr === 'innerHTML') {
            el.innerHTML = lang === 'ta' ? ta : en;
          } else if (attr) {
            el.setAttribute(attr, lang === 'ta' ? ta : en);
          } else {
            el.textContent = lang === 'ta' ? ta : en;
          }
        }
      });
    });

    // 2. Process automatic data-attribute based bindings
    const elements = document.querySelectorAll('[data-ta]');
    elements.forEach(el => {
      const ta = el.getAttribute('data-ta');
      const en = el.getAttribute('data-en');
      const attr = el.getAttribute('data-lang-attr');
      const isHtml = el.getAttribute('data-lang-html') === 'true';

      if (isHtml) {
        el.innerHTML = lang === 'ta' ? ta : en;
      } else if (attr) {
        el.setAttribute(attr, lang === 'ta' ? ta : en);
      } else {
        el.textContent = lang === 'ta' ? ta : en;
      }
    });
  }

  function sync() {
    const lang = localStorage.getItem('lang') || 'ta';
    apply(lang);
  }

  // Register event listeners only once globally
  if (!window.__langSyncGlobalSetup) {
    window.__langSyncGlobalSetup = true;
    window.__langSyncCallbacks = window.__langSyncCallbacks || [];

    window.addEventListener('lang-change', (e) => {
      const newLang = e.detail || 'ta';
      document.documentElement.setAttribute('lang', newLang);
      window.__langSyncCallbacks.forEach(cb => {
        try { cb(newLang); } catch (err) { /* ignore elements unmounted */ }
      });
    });

    document.addEventListener('astro:page-load', () => {
      const currentLang = localStorage.getItem('lang') || 'ta';
      document.documentElement.setAttribute('lang', currentLang);
      window.__langSyncCallbacks.forEach(cb => {
        try { cb(currentLang); } catch (err) { /* ignore */ }
      });
    });
  }

  // Register Layout vs Page callback slots to prevent duplicate listeners on navigation
  const isLayoutCall = bindings.some(b => b.selector && b.selector.includes('nav'));
  if (isLayoutCall) {
    window.__layoutLangSyncCallback = apply;
  } else {
    window.__pageLangSyncCallback = apply;
  }

  // Re-build active callback list
  window.__langSyncCallbacks = [];
  if (window.__layoutLangSyncCallback) {
    window.__langSyncCallbacks.push(window.__layoutLangSyncCallback);
  }
  if (window.__pageLangSyncCallback) {
    window.__langSyncCallbacks.push(window.__pageLangSyncCallback);
  }

  // Run sync immediately for the current mount
  sync();
}
