import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const pdfPath = process.argv[2] || 'C:/Users/pc/Downloads/Kaiser Styve - CV (3).pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const renderScale = 1;
const viewport = page.getViewport({ scale: renderScale });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport }).promise;
const { width: W, height: H } = viewport;
const img = ctx.getImageData(0, 0, W, H).data;

function rgb(x, y) {
  const i = (Math.round(y) * W + Math.round(x)) * 4;
  return [img[i], img[i + 1], img[i + 2]];
}
function hex(x, y) {
  return `#${rgb(x, y).map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
function isPageBg(r, g, b) {
  return Math.abs(r - 250) < 8 && Math.abs(g - 251) < 8 && Math.abs(b - 252) < 8;
}
function isCardWhite(r, g, b) {
  return r > 250 && g > 250 && b > 250;
}

// Locate profile card: top-left white region
let cardX1 = 0, cardY1 = 0;
outer: for (let y = 50; y < H * 0.3; y++) {
  for (let x = 30; x < W * 0.45; x++) {
    const [r, g, b] = rgb(x, y);
    if (isCardWhite(r, g, b)) { cardX1 = x; cardY1 = y; break outer; }
  }
}

// Find top-left corner radius: move right from (cardX1, cardY1) until leave white
let radius = 0;
for (let d = 0; d < 80; d++) {
  const [r, g, b] = rgb(cardX1 + d, cardY1);
  if (!isCardWhite(r, g, b) && !isPageBg(r, g, b)) continue;
  if (isPageBg(r, g, b)) { radius = d; break; }
}
// Better: scan diagonal from outside corner inward
let r2 = 0;
for (let d = 0; d < 80; d++) {
  const [r, g, b] = rgb(cardX1 + d, cardY1 + d);
  if (isCardWhite(r, g, b)) { r2 = d; break; }
}

// Shadow under card: find card bottom then sample row below
let cardY2 = cardY1;
for (let y = cardY1; y < cardY1 + 600; y++) {
  if (!isCardWhite(...rgb(cardX1 + 100, y))) { cardY2 = y; break; }
}
const shadowRow = [];
for (let x = cardX1; x < cardX1 + 400; x++) {
  const [r, g, b] = rgb(x, cardY2 + 8);
  if (!isPageBg(r, g, b)) shadowRow.push({ x, hex: hex(x, cardY2 + 8), r, g, b });
}

// Page bg average
const pageSamples = [hex(20, 20), hex(W - 20, 20), hex(20, H - 20)];

// Text content with colors - use getTextContent positions more carefully
const pageW = page.view[2];
const pageH = page.view[3];
const scaleToPt = 595.28 / pageW;
const text = await page.getTextContent();

const roles = {
  name: /^(STYVE MABA|KAISER)/i,
  subtitle: /^DÉVELOPPEUR FULL-STACK/i,
  sectionTitle: /^(Profil|Compétences|Loisirs|Experience|Education|Formations)/i,
  body: /passionné|production|architecture/i,
  contact: /@|linkedin|github|\+242/i,
  roleTitle: /LRC Group|WEBTIX|Consultant/i,
  statValue: /^\+25$|^\+5ans$/i,
  statLabel: /^Projets$|D'experience/i,
  missions: /^Missions$/i,
  stack: /^Stack$/i,
  badge: /En cours|\+ 2 ans/i,
  skillCat: /Architecture &|Backend &|Infrastructure|Interfaces/i,
  education: /Licence|Master|Udemy/i,
};

const results = {};
for (const [role, re] of Object.entries(roles)) {
  const hit = text.items.find((t) => re.test(t.str.trim()));
  if (!hit) continue;
  const x = hit.transform[4] * (W / pageW);
  const y = (pageH - hit.transform[5]) * (H / pageH);
  // sample multiple points around baseline
  const colors = [];
  for (let dx = 0; dx < 20; dx += 5) {
    colors.push(hex(x + dx, y - 2));
  }
  results[role] = {
    str: hit.str.trim().slice(0, 40),
    sizePt: Math.round(hit.height * scaleToPt * 100) / 100,
    colors: [...new Set(colors)],
  };
}

console.log(JSON.stringify({
  pageBg: pageSamples,
  cardTopLeft: { cardX1, cardY1 },
  borderRadiusPx: { fromTopEdge: radius, fromDiagonal: r2 },
  borderRadiusMm: Math.round((r2 / W) * 210 * 10) / 10,
  shadowUnderCard: shadowRow.slice(0, 12),
  shadowRgbAvg: shadowRow.length ? {
    r: Math.round(shadowRow.reduce((s, p) => s + p.r, 0) / shadowRow.length),
    g: Math.round(shadowRow.reduce((s, p) => s + p.g, 0) / shadowRow.length),
    b: Math.round(shadowRow.reduce((s, p) => s + p.b, 0) / shadowRow.length),
  } : null,
  typography: results,
  sizeFrequency: [...text.items.reduce((m, t) => {
    if (!t.str.trim()) return m;
    const pt = Math.round(t.height * scaleToPt * 10) / 10;
    m.set(pt, (m.get(pt) || 0) + 1);
    return m;
  }, new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([pt, n]) => ({ pt, n })),
}, null, 2));
