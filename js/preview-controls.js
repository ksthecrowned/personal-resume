(function initPreviewToolbar() {
  const page = document.getElementById('cv-page');
  const clipButton = document.getElementById('clip-toggle');
  const variantSelect = document.getElementById('variant-select');
  const langSelect = document.getElementById('lang-select');
  if (!page || !clipButton || !variantSelect || !langSelect) return;

  const storageKey = 'cv-a4-clip';
  const params = new URLSearchParams(window.location.search);
  const currentVariant = params.get('variant') || 'default';

  function applyClip(enabled) {
    page.classList.toggle('cv-page--clip', enabled);
    clipButton.setAttribute('aria-pressed', String(enabled));
    clipButton.textContent = enabled ? 'Rognage A4 : activé' : 'Rognage A4 : désactivé';
  }

  function updateQuery(nextVariant, nextLang) {
    const next = new URLSearchParams(window.location.search);
    if (nextVariant) next.set('variant', nextVariant);
    if (nextLang) next.set('lang', nextLang);
    else next.delete('lang');
    next.delete('locale');
    window.location.search = next.toString();
  }

  function setSelectOptions(select, options, selected) {
    select.innerHTML = options
      .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    if (selected) select.value = selected;
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
      setSelectOptions(variantSelect, variantOptions, currentVariant);

      const activeVariantMeta = (await loadVariantMeta(currentVariant)) || {};
      const locales = activeVariantMeta.meta?.availableLocales || ['fr'];
      const localeLabels = { fr: 'Français', en: 'English' };
      const langFromQuery = params.get('lang') || params.get('locale');
      const currentLang = locales.includes(langFromQuery)
        ? langFromQuery
        : activeVariantMeta.meta?.defaultLocale || locales[0] || 'fr';
      setSelectOptions(
        langSelect,
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
      variantSelect.style.display = 'none';
      langSelect.style.display = 'none';
    }
  }

  const saved = localStorage.getItem(storageKey);
  applyClip(saved === null ? true : saved === 'true');
  clipButton.addEventListener('click', () => {
    const enabled = !page.classList.contains('cv-page--clip');
    applyClip(enabled);
    localStorage.setItem(storageKey, String(enabled));
  });

  initSwitchers();
})();
