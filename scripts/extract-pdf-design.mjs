import fs from 'fs';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const pdfPath = process.argv[2] || 'C:/Users/pc/Downloads/Kaiser Styve - CV (3).pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const [x0, y0, x1, y1] = page.view;
const pageW = x1 - x0;
const pageH = y1 - y0;
const scaleToPt = 595.28 / pageW; // A4 reference width

function toPt(n) {
  return Math.round(n * scaleToPt * 100) / 100;
}

function rgbKey(c) {
  if (!c?.length) return null;
  if (c.length === 3) {
    const [r, g, b] = c.map((v) => Math.round(v * 255));
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  if (c.length === 4) {
    const [c1, m, y, k] = c;
    const r = Math.round(255 * (1 - c1) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }
  if (c.length === 1) {
    const g = Math.round(c[0] * 255);
    return `#${g.toString(16).padStart(2, '0').repeat(3)}`;
  }
  return null;
}

const text = await page.getTextContent();
const ops = await page.getOperatorList();

const items = text.items
  .filter((t) => t.str.trim())
  .map((t) => ({
    str: t.str.trim(),
    font: t.fontName,
    sizePdf: Math.round(t.height * 100) / 100,
    sizePt: toPt(t.height),
    x: Math.round(t.transform[4]),
    yFromTop: Math.round(pageH - t.transform[5]),
  }));

function classify(item) {
  const s = item.str;
  if (/^STYVE MABA$/i.test(s)) return 'name';
  if (/DÉVELOPPEUR FULL-STACK|FULL-STACK SOFTWARE/i.test(s)) return 'subtitle';
  if (/^(Profil|Compétences|Loisirs|Experience|Education|Formations)/i.test(s)) return 'section-title';
  if (/^Stack$/i.test(s)) return 'stack-label';
  if (/^Missions$/i.test(s)) return 'missions-label';
  if (/^\+25$|^\+5ans$|^Projets$|D'experience/i.test(s)) return 'stat';
  if (/LRC Group|Consultant|WEBTIX/i.test(s)) return 'role-title';
  if (/En cours|\+ 2 ans/i.test(s)) return 'badge';
  if (/Architecture|Backend|Infrastructure|Interfaces/i.test(s)) return 'skill-category';
  if (/@|linkedin|github|\+242|rue /i.test(s)) return 'contact';
  if (/Programmation|Jeux vidéo|Mangas/i.test(s)) return 'hobby-label';
  if (/Licence|Master|Université|Udemy|Zero To Mastery/i.test(s)) return 'education';
  if (item.sizePt >= 16) return 'stat-value-large';
  if (item.sizePt >= 11) return 'heading';
  if (item.sizePt >= 9.5) return 'body';
  return 'small';
}

const byClass = {};
for (const item of items) {
  const cls = classify(item);
  if (!byClass[cls]) byClass[cls] = [];
  byClass[cls].push(item.sizePt);
}
for (const [cls, sizes] of Object.entries(byClass)) {
  const uniq = [...new Set(sizes.map((s) => Math.round(s * 10) / 10))].sort((a, b) => b - a);
  console.log(`${cls}: ${uniq.join(', ')} pt`);
}

// Colors from operator list
let currentFill = null;
const fills = new Map();
const paths = [];

for (let i = 0; i < ops.fnArray.length; i++) {
  const fn = ops.fnArray[i];
  const args = ops.argsArray[i];
  switch (fn) {
    case OPS.setFillRGBColor:
      currentFill = rgbKey(args);
      break;
    case OPS.setFillCMYKColor:
      currentFill = rgbKey(args);
      break;
    case OPS.setFillGray:
      currentFill = rgbKey(args);
      break;
    case OPS.setFillColor:
      currentFill = rgbKey(args);
      break;
    case OPS.constructPath: {
      const [op, ...coords] = args;
      if (currentFill) {
        fills.set(currentFill, (fills.get(currentFill) || 0) + 1);
        // bbox from coords
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let j = 0; j < coords.length; j += 2) {
          const px = coords[j];
          const py = coords[j + 1];
          if (typeof px === 'number' && typeof py === 'number') {
            minX = Math.min(minX, px);
            maxX = Math.max(maxX, px);
            minY = Math.min(minY, py);
            maxY = Math.max(maxY, py);
          }
        }
        if (isFinite(minX)) {
          const w = maxX - minX;
          const h = maxY - minY;
          paths.push({
            fill: currentFill,
            x: Math.round(minX),
            y: Math.round(pageH - maxY),
            w: Math.round(w),
            h: Math.round(h),
            op,
            coordCount: coords.length,
          });
        }
      }
      break;
    }
    case OPS.fill:
    case OPS.eoFill:
      if (currentFill) fills.set(currentFill, (fills.get(currentFill) || 0) + 1);
      break;
  }
}

console.log('\n=== FILL COLORS ===');
console.log([...fills.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ color: c, count: n })));

console.log('\n=== LARGE PATHS (cards / backgrounds) ===');
const big = paths.filter((p) => p.w > 100 && p.h > 50).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 15);
for (const p of big) {
  console.log({ ...p, wMm: Math.round((p.w / pageW) * 210 * 10) / 10, hMm: Math.round((p.h / pageH) * 297 * 10) / 10 });
}

// Rounded corner estimate: look for small curve segments in path ops near card corners
const roundedCandidates = paths.filter((p) => p.w > 200 && p.h > 80 && p.coordCount > 20);
console.log('\n=== ROUNDED RECT CANDIDATES (complex paths) ===');
console.log(roundedCandidates.slice(0, 8).map((p) => ({ fill: p.fill, w: p.w, h: p.h, coords: p.coordCount })));

// Render and sample pixels for page bg, card bg, shadow
try {
  const renderScale = 0.25;
  const viewport = page.getViewport({ scale: renderScale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  function sample(x, y) {
    const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return `#${[d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  }

  const samples = {
    pageBg_topLeft: sample(10, 10),
    pageBg_bottomRight: sample(viewport.width - 10, viewport.height - 10),
    cardBg_profile: sample(viewport.width * 0.12, viewport.height * 0.22),
    cardShadow_near: sample(viewport.width * 0.12, viewport.height * 0.24),
    accent_purple_stat: sample(viewport.width * 0.08, viewport.height * 0.38),
    accent_orange_stat: sample(viewport.width * 0.18, viewport.height * 0.38),
    text_dark: sample(viewport.width * 0.15, viewport.height * 0.28),
    section_title: sample(viewport.width * 0.12, viewport.height * 0.16),
    experience_title: sample(viewport.width * 0.42, viewport.height * 0.04),
  };
  console.log('\n=== PIXEL SAMPLES (rendered) ===');
  console.log(samples);
} catch (e) {
  console.log('\n(Render skipped:', e.message, ')');
}

console.log('\n=== KEY SAMPLES (pt) ===');
for (const p of [
  /STYVE MABA/,
  /DÉVELOPPEUR FULL-STACK/,
  /Experience/,
  /Compétences/,
  /Profil/,
  /\+25/,
  /Projets/,
  /\+5ans/,
  /LRC Group/,
  /Stack/,
  /Missions/,
  /kaiserstyve/,
  /Programmation/,
  /Licence/,
  /En cours/,
  /\+ 2 ans/,
]) {
  const hit = items.find((t) => p.test(t.str));
  if (hit) console.log({ role: p.source, str: hit.str.slice(0, 40), sizePt: hit.sizePt, font: hit.font });
}
