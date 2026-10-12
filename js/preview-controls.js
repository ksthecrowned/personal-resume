import { alignDensePageBreaks, measurePageHeightPx, alignEducationWithFormations } from './dense-page-breaks.mjs';

(function initPreviewToolbar() {
  const page = document.getElementById('cv-page');
  const clipButton = document.getElementById('clip-toggle');
  const downloadButton = document.getElementById('download-cv');
  const variantSelect = document.getElementById('variant-select');
  const langSelect = document.getElementById('lang-select');
  if (!page || !clipButton || !downloadButton || !variantSelect || !langSelect) return;

  const storageKey = 'cv-a4-clip';
  const params = new URLSearchParams(window.location.search);
  const currentVariant = params.get('variant') || 'default';

  function updatePageGuides() {
    const existing = page.querySelector('.cv-page-guides');
    if (!page.classList.contains('cv--dense')) {
      existing?.remove();
      return;
    }

    const pageHeightPx = measurePageHeightPx();
    const contentHeight = Math.max(page.scrollHeight, page.offsetHeight);
    const pageCount = Math.max(1, Math.ceil(contentHeight / pageHeightPx - 0.01));

    let guides = existing;
    if (!guides) {
      guides = document.createElement('div');
      guides.className = 'cv-page-guides';
      guides.setAttribute('aria-hidden', 'true');
      page.appendChild(guides);
    }

    guides.innerHTML = Array.from({ length: pageCount }, (_, index) => {
      const top = index * pageHeightPx;
      return `<div class="cv-page-guide" style="top:${top}px"><span class="cv-page-guide__label">Page ${index + 1}</span></div>`;
    }).join('');
  }

  function refreshDensePagination() {
    alignDensePageBreaks(page);
    alignEducationWithFormations(page);
    updatePageGuides();
  }

  const clipState = clipButton.querySelector('[data-clip-state]');

  function applyClip(enabled) {
    page.classList.toggle('cv-page--clip', enabled);
    clipButton.setAttribute('aria-pressed', String(enabled));
    clipButton.setAttribute('aria-label', enabled ? 'Rognage A4 activé' : 'Rognage A4 désactivé');
    if (clipState) clipState.textContent = enabled ? 'activé' : 'désactivé';
    refreshDensePagination();
  }

  const toolbar = clipButton.closest('.preview-toolbar');
  if (toolbar && 'ResizeObserver' in window) {
    const syncToolbarOffset = () => {
      document.documentElement.style.setProperty(
        '--toolbar-offset',
        `${Math.ceil(toolbar.getBoundingClientRect().height) + 12}px`,
      );
    };
    new ResizeObserver(syncToolbarOffset).observe(toolbar);
    syncToolbarOffset();
  }

  function escapeText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bindDropdown(root) {
    const trigger = root.querySelector('.preview-dropdown__trigger');
    const valueEl = root.querySelector('.preview-dropdown__value');
    const menu = root.querySelector('.preview-dropdown__menu');
    let options = [];
    let current = '';

    function close() {
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
    }

    function open() {
      document.querySelectorAll('.preview-field.is-open').forEach((el) => {
        if (el !== root) el.dispatchEvent(new CustomEvent('dropdown:close'));
      });
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
      const selected = menu.querySelector('[aria-selected="true"]');
      (selected || menu.querySelector('[role="option"]'))?.focus();
    }

    function render() {
      const active = options.find((opt) => opt.value === current) || options[0];
      current = active?.value || '';
      valueEl.textContent = active?.label || '';
      menu.innerHTML = options
        .map(
          (opt) => `
            <li role="presentation">
              <button type="button" class="preview-dropdown__option" role="option" data-value="${escapeText(opt.value)}" aria-selected="${opt.value === current ? 'true' : 'false'}">${escapeText(opt.label)}</button>
            </li>
          `,
        )
        .join('');
    }

    function choose(next) {
      if (!options.some((opt) => opt.value === next)) return;
      const changed = next !== current;
      current = next;
      render();
      close();
      trigger.focus();
      if (changed) root.dispatchEvent(new Event('change'));
    }

    Object.defineProperty(root, 'value', {
      get() {
        return current;
      },
    });

    root.addEventListener('dropdown:close', close);
    trigger.addEventListener('click', () => {
      if (root.classList.contains('is-open')) close();
      else open();
    });
    menu.addEventListener('click', (event) => {
      const option = event.target.closest('[data-value]');
      if (option) choose(option.dataset.value);
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!root.classList.contains('is-open')) open();
      } else if (event.key === 'Escape') {
        close();
      }
    });
    menu.addEventListener('keydown', (event) => {
      const items = [...menu.querySelectorAll('[role="option"]')];
      const index = items.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        trigger.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        items[Math.min(items.length - 1, index + 1)]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        items[Math.max(0, index - 1)]?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const option = document.activeElement?.closest('[data-value]');
        if (option) choose(option.dataset.value);
      }
    });
    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) close();
    });

    return {
      setOptions(next, selected) {
        options = next;
        current = selected || '';
        render();
      },
    };
  }

  const variantDropdown = bindDropdown(variantSelect);
  const langDropdown = bindDropdown(langSelect);

  function updateQuery(nextVariant, nextLang) {
    const next = new URLSearchParams(window.location.search);
    if (nextVariant) next.set('variant', nextVariant);
    if (nextLang) next.set('lang', nextLang);
    else next.delete('lang');
    next.delete('locale');
    window.location.search = next.toString();
  }

  function setSelectOptions(dropdown, options, selected) {
    dropdown.setOptions(options, selected);
  }

  async function loadVariantMeta(variantId) {
    const res = await fetch(`data/variants/${variantId}.json`);
    if (!res.ok) return null;
    return res.json();
  }

  async function initSwitchers() {
    try {
      const manifestRes = await fetch('data/variants/manifest.json');
      const manifest = manifestRes.ok ? await manifestRes.json() : { variants: [] };
      const variantOptions = (manifest.variants || []).map((v) => ({
        value: v.id,
        label: v.targetRole || v.label || v.id,
      }));
      if (!variantOptions.length) variantOptions.push({ value: 'default', label: 'Default' });
      setSelectOptions(variantDropdown, variantOptions, currentVariant);

      const activeVariantMeta = (await loadVariantMeta(currentVariant)) || {};
      const locales = activeVariantMeta.meta?.availableLocales || ['fr'];
      const localeLabels = { fr: 'Français', en: 'English' };
      const langFromQuery = params.get('lang') || params.get('locale');
      const currentLang = locales.includes(langFromQuery)
        ? langFromQuery
        : activeVariantMeta.meta?.defaultLocale || locales[0] || 'fr';
      setSelectOptions(
        langDropdown,
        locales.map((l) => ({ value: l, label: localeLabels[l] || l.toUpperCase() })),
        currentLang
      );

      variantSelect.addEventListener('change', async (e) => {
        const nextVariant = e.target.value;
        const nextVariantMeta = (await loadVariantMeta(nextVariant)) || {};
        const nextLocales = nextVariantMeta.meta?.availableLocales || ['fr'];
        const lang = nextLocales.includes(langSelect.value)
          ? langSelect.value
          : nextVariantMeta.meta?.defaultLocale || nextLocales[0] || 'fr';
        updateQuery(nextVariant, lang);
      });

      langSelect.addEventListener('change', (e) => {
        updateQuery(variantSelect.value, e.target.value);
      });
    } catch {
      variantSelect.hidden = true;
      langSelect.hidden = true;
    }
  }

  const saved = localStorage.getItem(storageKey);
  applyClip(saved === null ? false : saved === 'true');
  clipButton.addEventListener('click', () => {
    const enabled = !page.classList.contains('cv-page--clip');
    applyClip(enabled);
    localStorage.setItem(storageKey, String(enabled));
  });

  function downloadFilename() {
    const variant = variantSelect.value || currentVariant;
    const lang = langSelect.value || params.get('lang') || 'fr';
    const parts = ['Styve Maba - CV'];
    if (variant === 'gmu') parts.push('GMU');
    if (lang === 'en') parts.push('EN');
    return parts.join(' ');
  }

  downloadButton.addEventListener('click', () => {
    const previousTitle = document.title;
    const wasClipped = page.classList.contains('cv-page--clip');
    document.title = downloadFilename();
    if (wasClipped) page.classList.remove('cv-page--clip');

    const restore = () => {
      document.title = previousTitle;
      if (wasClipped) page.classList.add('cv-page--clip');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  });

  window.addEventListener('cv:rendered', () => {
    requestAnimationFrame(() => {
      refreshDensePagination();
      // Fonts / late layout can still shift heights slightly.
      setTimeout(refreshDensePagination, 100);
    });
  });
  window.addEventListener('resize', () => {
    requestAnimationFrame(refreshDensePagination);
  });

  initSwitchers();
  refreshDensePagination();
})();
