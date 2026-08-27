# Congo Terminal CV + Letter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an ATS-friendly Congo Terminal spontaneous application pack (densified dynamic CV variant + updated letter) from the approved content draft.

**Architecture:** Add optional `meta.layout` flags on CV variants; `js/render.js` applies CSS classes on `#cv-page`. Create `data/variants/congo-terminal.json` from the validated content draft. Update the existing Congo Terminal letter HTML. Export PDFs with existing Playwright scripts. No Mirfa / JobForge.

**Tech Stack:** Static HTML/CSS/JS CV pipeline (`index.html`, `js/render.js`, `data/variants/*.json`), letter HTML in `lettres/`, Playwright PDF scripts (`scripts/generate-cv-pdf.mjs`, `scripts/generate-lettre-pdf.mjs`), Bun/`serve` preview.

## Global Constraints

- Title / letter object: `Ingénieur Full-Stack · Systèmes d’information & projets`
- Content source of truth: `docs/superpowers/specs/2026-08-27-congo-terminal-cv-content-draft.md`
- Numbers only from dump: 5+ years; 4+ showcase sites; 100 000+ Play Store downloads — no −70%, no team of 5, no product names absent from the draft
- English line: `courant à l’écrit, conversationnel à l’oral`
- Letter recipient: Congo Terminal — Directeur Général
- FR only; no Mirfa; no JobForge
- Dense layout must stay ATS-friendly (selectable text, standard headings, contacts in plain text)
- CV length target ~1.5 pages, max 2 (dense print must not silently clip via `overflow: hidden`)
- Other variants must not regress when `meta.layout` is absent

**Spec:** `docs/superpowers/specs/2026-08-27-congo-terminal-cv-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `js/layout-flags.js` | Pure helpers: normalize `meta.layout` → CSS class list (testable without DOM) |
| `js/render.js` | Call layout helpers; apply classes on `#cv-page` after variant load |
| `css/layout.css` | Screen rules for `.cv--dense`, `.cv--hide-photo`, `.cv--hide-stats`, `.cv--hide-hobbies` |
| `css/print.css` | Dense multi-page print (up to 2 A4); keep non-dense single-page clip behavior |
| `data/variants/congo-terminal.json` | FR content + `meta.layout` dense flags |
| `data/variants/manifest.json` | Register variant for preview toolbar |
| `lettres/Styve Maba - Lettre Congo Terminal.html` | DG recipient + draft body |
| `tests/layout-flags.test.mjs` | Node assert tests for layout class mapping |
| `exports/congo-terminal/fr/Styve Maba - CV.pdf` | Generated CV PDF (not hand-edited) |
| `lettres/Styve Maba - Lettre Congo Terminal.pdf` | Regenerated letter PDF |

---

### Task 1: Layout flags helper + tests

**Files:**
- Create: `js/layout-flags.js`
- Create: `tests/layout-flags.test.mjs`

**Interfaces:**
- Consumes: `variantData.meta.layout` object (optional)
- Produces:
  - `normalizeLayout(layout): { dense: boolean, hidePhoto: boolean, hideHobbies: boolean, hideStats: boolean }`
  - `layoutCssClasses(layout): string[]` — e.g. `["cv--dense", "cv--hide-photo", ...]`

- [ ] **Step 1: Write the failing test**

Create `tests/layout-flags.test.mjs`:

```js
import assert from "node:assert/strict";
import { normalizeLayout, layoutCssClasses } from "../js/layout-flags.js";

assert.deepEqual(normalizeLayout(undefined), {
  dense: false,
  hidePhoto: false,
  hideHobbies: false,
  hideStats: false,
});

assert.deepEqual(
  normalizeLayout({
    dense: true,
    hidePhoto: true,
    hideHobbies: true,
    hideStats: true,
  }),
  { dense: true, hidePhoto: true, hideHobbies: true, hideStats: true },
);

assert.deepEqual(layoutCssClasses(undefined), []);
assert.deepEqual(layoutCssClasses({ dense: true, hidePhoto: true }), [
  "cv--dense",
  "cv--hide-photo",
]);

assert.deepEqual(layoutCssClasses({ dense: "yes", hidePhoto: 1 }), []);

console.log("layout-flags: all tests passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/layout-flags.test.mjs`  
Expected: FAIL — `Cannot find module '../js/layout-flags.js'` (or similar)

- [ ] **Step 3: Implement `js/layout-flags.js`**

```js
function asBool(value) {
  return value === true;
}

export function normalizeLayout(layout) {
  const src = layout && typeof layout === "object" ? layout : {};
  return {
    dense: asBool(src.dense),
    hidePhoto: asBool(src.hidePhoto),
    hideHobbies: asBool(src.hideHobbies),
    hideStats: asBool(src.hideStats),
  };
}

export function layoutCssClasses(layout) {
  const flags = normalizeLayout(layout);
  const classes = [];
  if (flags.dense) classes.push("cv--dense");
  if (flags.hidePhoto) classes.push("cv--hide-photo");
  if (flags.hideHobbies) classes.push("cv--hide-hobbies");
  if (flags.hideStats) classes.push("cv--hide-stats");
  return classes;
}
```

Note: `package.json` has `"type": "commonjs"`. Either:
- use `.mjs` for both files and ESM `import`/`export` as above, **or**
- implement with `module.exports` / `require` in `.js` / `.cjs`.

Prefer: keep helper as `js/layout-flags.mjs` and test as `tests/layout-flags.test.mjs` (ESM) to avoid flipping package type. If you rename to `.mjs`, update the test import path accordingly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/layout-flags.test.mjs`  
Expected: `layout-flags: all tests passed`

- [ ] **Step 5: Commit**

```bash
git add js/layout-flags.mjs tests/layout-flags.test.mjs
git commit -m "$(cat <<'EOF'
feat(cv): add layout flag helpers for dense ATS variants

EOF
)"
```

---

### Task 2: Wire layout classes into render + CSS

**Files:**
- Modify: `js/render.js`
- Modify: `css/layout.css`
- Modify: `css/print.css`
- Modify: `index.html` (only if a script tag must load the helper; prefer dynamic `import()` from `render.js` **or** inline the two functions into `render.js` and keep `layout-flags.mjs` as the single source imported by tests — if browser `import` is awkward with `serve` + classic script, **duplicate is forbidden**: convert `render.js` load to `type="module"` **or** copy the helper logic into `render.js` and have tests import a shared `.mjs` that `render.js` also loads via module.

**Recommended wiring (simplest with current classic script):**
1. Keep `js/layout-flags.mjs` as source of truth.
2. Change `index.html` script to:

```html
<script type="module" src="js/render.js"></script>
<script type="module" src="js/preview-controls.js"></script>
```

3. At top of `render.js`:

```js
import { layoutCssClasses } from "./layout-flags.mjs";
```

4. Ensure `preview-controls.js` still works as a module (no bare globals assumed beyond DOM).

**Interfaces:**
- Consumes: `layoutCssClasses(variantData.meta?.layout)`
- Produces: classes on `#cv-page` (`cv-page` kept; dense/hide-* added/removed each load)

- [ ] **Step 1: Add `applyLayout(layout)` in `render.js`**

```js
function applyLayout(layout) {
  const page = document.getElementById("cv-page");
  if (!page) return;
  const layoutClasses = [
    "cv--dense",
    "cv--hide-photo",
    "cv--hide-hobbies",
    "cv--hide-stats",
  ];
  for (const cls of layoutClasses) page.classList.remove(cls);
  for (const cls of layoutCssClasses(layout)) page.classList.add(cls);
}
```

Call it inside `loadCv()` after `loadVariantData`, using `variantData.meta?.layout` (not locale content):

```js
applyLayout(variantData.meta?.layout);
```

- [ ] **Step 2: Add screen CSS in `css/layout.css`**

```css
/* Dense / ATS layout flags (per-variant via meta.layout) */
.cv-page.cv--hide-photo .identity__photo-wrap {
  display: none;
}

.cv-page.cv--hide-stats .stats-row {
  display: none;
}

.cv-page.cv--hide-hobbies .cv-section:has(#hobbies-container) {
  display: none;
}

.cv-page.cv--dense {
  /* slight density — keep selectable text */
  font-size: 9.5pt;
}

.cv-page.cv--dense .skill-block {
  margin-bottom: 2mm;
}

.cv-page.cv--dense .skill-block__list {
  gap: 0;
}

.cv-page.cv--dense .experience-card {
  margin-bottom: 3mm;
}

.cv-page.cv--dense .profile-text {
  font-size: 8.5pt;
  line-height: 1.35;
}
```

If `:has()` is undesirable, add `id="hobbies-section"` on the hobbies `<section>` in `index.html` and target `#hobbies-section` instead.

- [ ] **Step 3: Allow dense print up to 2 pages in `css/print.css`**

Inside `@media print`, after existing `.cv-page` rules, add:

```css
  .cv-page.cv--dense {
    height: auto;
    max-height: none;
    min-height: 297mm;
    overflow: visible;
  }

  .cv-page.cv--dense.cv-page--clip {
    /* preview clip must not hide page 2 content when printing */
    max-height: none;
    overflow: visible;
  }
```

Non-dense variants keep the current single-page clip (`height: 297mm; max-height: 297mm; overflow: hidden`).

- [ ] **Step 4: Manual smoke (no dense variant yet)**

Run: `bun run preview`  
Open `http://localhost:3000/?variant=default&lang=fr`  
Expected: unchanged layout (no `cv--dense` classes on `#cv-page`).

Optional DOM check in console:

```js
document.getElementById("cv-page").className
```

Expected: includes `cv-page`, does **not** include `cv--dense`.

- [ ] **Step 5: Commit**

```bash
git add js/render.js js/preview-controls.js index.html css/layout.css css/print.css
git commit -m "$(cat <<'EOF'
feat(cv): apply per-variant dense layout CSS classes

EOF
)"
```

---

### Task 3: Create `congo-terminal` variant + manifest

**Files:**
- Create: `data/variants/congo-terminal.json`
- Modify: `data/variants/manifest.json`
- Reference only (do not invent content): `docs/superpowers/specs/2026-08-27-congo-terminal-cv-content-draft.md`

**Interfaces:**
- Consumes: content draft sections
- Produces: variant id `congo-terminal` loadable at `/?variant=congo-terminal&lang=fr`

- [ ] **Step 1: Add manifest entry**

In `data/variants/manifest.json`, append:

```json
{
  "id": "congo-terminal",
  "label": "Congo Terminal — SI & projets",
  "targetRole": "Ingénieur Full-Stack · Systèmes d’information & projets",
  "createdAt": "2026-08-27",
  "previewUrl": "/?variant=congo-terminal&lang=fr"
}
```

- [ ] **Step 2: Create `data/variants/congo-terminal.json`**

Use the same schema as `responsable-it.json` / `default.json`, **fr only**. Required shape:

```json
{
  "meta": {
    "id": "congo-terminal",
    "label": "Congo Terminal — SI & projets",
    "defaultLocale": "fr",
    "availableLocales": ["fr"],
    "createdAt": "2026-08-27",
    "notes": "Candidature spontanée Congo Terminal / AGL. ATS: SI, production, intégration, TPE/NFC, legacy, pilotage projets, Pointe-Noire.",
    "layout": {
      "dense": true,
      "hidePhoto": true,
      "hideHobbies": true,
      "hideStats": true
    }
  },
  "locales": {
    "fr": {
      "meta": {
        "pageTitle": "Styve Maba — CV Congo Terminal",
        "targetRole": "Ingénieur Full-Stack · Systèmes d’information & projets"
      },
      "identity": { "name": "Styve Maba", "photoAlt": "Styve Maba" },
      "profile": {
        "title": "Ingénieur Full-Stack · Systèmes d’information & projets",
        "summary": "<paste draft profile as one or two paragraphs matching draft>"
      },
      "contacts": [ /* same pattern as default.json */ ],
      "skills": [ /* 6–7 blocks from draft incl. Langues + IA secondaire */ ],
      "experiences": [
        /* LRC, Consulting, Webtinix, then Projets personnels card */
      ],
      "education": [ /* UMNG + Lycée from draft */ ],
      "certifications": [
        "Complete Web Developer (ZTM) · Advanced CSS & Sass (Udemy) · Ethical Hacking From Scratch (Udemy)"
      ]
    }
  }
}
```

**Content mapping rules (must follow draft verbatim in meaning):**

| Draft section | JSON field |
|---------------|------------|
| Profil | `profile.summary` (may join the 3 paragraphs with spaces) |
| Compétences blocks | `skills[]` with `title` + `items` (keyword lines; IA secondary; Langues with approved English wording) |
| LRC / Consulting / Webtinix | `experiences[0..2]` with `summary`, `missions`, `stack`, badges |
| Projets | Fourth experience card: `"role": "PROJETS PERSONNELS"`, `projects: ["TimeGate — …", "Paradis Immobilier — …", "StoryForge — …"]` |
| Formation | `education[]` |
| Certifs | single compact `certifications` string as above |

**Do not include:** `stats`, `hobbies` (or set `[]`).  
**Do not include:** −70%, équipe de 5, Ride/DTMoney, MyTélévision names unless present in the content draft (they are not).

Phone contact text (match draft): `(+242) 06 515 23 74 · 05 59 89 707`

- [ ] **Step 3: Preview verification**

Run: `bun run preview`  
Open: `http://localhost:3000/?variant=congo-terminal&lang=fr`

Checklist:
- [ ] Title shows locked title
- [ ] Photo hidden
- [ ] Stats hidden
- [ ] Hobbies section hidden
- [ ] `#cv-page` has classes `cv--dense cv--hide-photo cv--hide-hobbies cv--hide-stats`
- [ ] English line exact: `courant à l’écrit, conversationnel à l’oral`
- [ ] No forbidden metrics in page text (search −70, équipe de 5, Ride, DTMoney)
- [ ] TimeGate visible
- [ ] Print preview ≈ 1.5–2 pages, nothing critical clipped

- [ ] **Step 4: Commit**

```bash
git add data/variants/congo-terminal.json data/variants/manifest.json
git commit -m "$(cat <<'EOF'
feat(cv): add Congo Terminal dense ATS variant

EOF
)"
```

---

### Task 4: Update Congo Terminal letter

**Files:**
- Modify: `lettres/Styve Maba - Lettre Congo Terminal.html`
- Reference: content draft letter section

- [ ] **Step 1: Replace recipient block**

```html
<div class="letter-recipient">
  <strong>Congo Terminal</strong>
  À l’attention du Directeur Général<br />
  Pointe-Noire, Congo-Brazzaville
</div>
```

- [ ] **Step 2: Replace object + body + closing**

Object:

```html
<p class="letter-object">
  Objet : Candidature spontanée — Ingénieur Full-Stack · Systèmes d’information & projets
</p>
```

Body: copy the four paragraphs + formulas from the content draft (`Madame, Monsieur le Directeur Général`, …).  
Remove old claims: Responsable Informatique object, P1/P2/−70%, équipe de cinq, Ride/DTMoney, IA-open-source pitch unless in draft.

Footer date: use the implementation day, e.g. `Pointe-Noire, le 27 août 2026` (or the actual export date).

- [ ] **Step 3: Visual check**

Open `lettres/Styve Maba - Lettre Congo Terminal.html` in the browser.  
Expected: one A4 page, DG recipient, new object, no old metrics.

- [ ] **Step 4: Commit**

```bash
git add "lettres/Styve Maba - Lettre Congo Terminal.html"
git commit -m "$(cat <<'EOF'
feat(letter): retarget Congo Terminal letter to Directeur Général

EOF
)"
```

---

### Task 5: Export PDFs + final QA

**Files:**
- Generate: `exports/congo-terminal/fr/Styve Maba - CV.pdf`
- Generate: `lettres/Styve Maba - Lettre Congo Terminal.pdf`

- [ ] **Step 1: Ensure preview server is running**

Run: `bun run preview`  
Expected: `serve` listening (default port — confirm URL; scripts default `CV_BASE_URL=http://localhost:3000`).

If port differs, set `CV_BASE_URL` accordingly.

- [ ] **Step 2: Export CV PDF**

```bash
CV_VARIANT=congo-terminal CV_LANG=fr bun run export:pdf:single
```

Expected console: `PDF saved: .../exports/congo-terminal/fr/Styve Maba - CV.pdf`

- [ ] **Step 3: Export letter PDF**

```bash
bun run export:pdf:lettre "Styve Maba - Lettre Congo Terminal"
```

Expected: `lettres/Styve Maba - Lettre Congo Terminal.pdf` updated.

- [ ] **Step 4: Final QA checklist**

- [ ] CV PDF ≤ 2 pages, readable, selectable text
- [ ] Letter PDF 1 page, DG + correct object
- [ ] `default` / `responsable-it` preview still show photo + stats (no dense classes)
- [ ] Content matches draft (spot-check LRC TPE/NFC bullet + English line)

- [ ] **Step 5: Commit PDFs if the repo tracks them**

```bash
git add "exports/congo-terminal/fr/Styve Maba - CV.pdf" "lettres/Styve Maba - Lettre Congo Terminal.pdf"
git status
# If PDFs are gitignored, skip; do not force-add secrets or ignored binaries against repo policy
git commit -m "$(cat <<'EOF'
chore: export Congo Terminal CV and letter PDFs

EOF
)"
```

Only commit PDF paths that `git status` shows as addable.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Variante `congo-terminal.json` | Task 3 |
| Manifest entry | Task 3 |
| `meta.layout` dense flags | Tasks 1–3 |
| CSS/JS densification, ATS-safe | Task 2 |
| Letter DG + draft | Task 4 |
| Export PDF CV + letter | Task 5 |
| FR only / no Mirfa / chiffres stricts | Tasks 3–4 constraints |
| Other variants unchanged | Tasks 2 & 5 QA |
| ~1.5–2 pages (no silent clip) | Task 2 print.css dense override |

## Placeholder scan

No TBD/TODO left in task steps. Content must be copied from the content draft file, not invented.
