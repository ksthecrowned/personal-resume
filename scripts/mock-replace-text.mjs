import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { ocrImageToPdf } from './lib/ocr-to-pdf.mjs';
import { renderTextPng } from './lib/render-text-png.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fontsDir = path.join(root, 'assets', 'fonts');

const input = process.argv[2];
const outPdf = process.argv[3];
const titleText = process.argv[4] || 'Robert Lewandowski';
const crumbText = process.argv[5] || titleText;

if (!input || !outPdf) {
  console.error(
    'Usage: node scripts/mock-replace-text.mjs <input.png> <output.pdf> [title] [breadcrumb]',
  );
  process.exit(1);
}

const meta = await sharp(input).metadata();
const w = meta.width;
const h = meta.height;

// skills.sh — titre en Fira Mono (pas Press Start 2P)
const titleFont = path.join(fontsDir, 'FiraMono-Regular.ttf');
const crumbFont = path.join(fontsDir, 'Inter-SemiBold.ttf');

const title = await renderTextPng({
  text: titleText,
  fontPath: titleFont,
  fontSize: 42,
  fontWeight: 400,
  color: '#ffffff',
});

const crumb = await renderTextPng({
  text: crumbText,
  fontPath: crumbFont,
  fontSize: 13,
  fontWeight: 600,
  color: '#ffffff',
});

const overlay = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect x="244" y="22" width="200" height="20" fill="#0f0f0f"/>
  <rect x="35" y="78" width="660" height="66" fill="#0f0f0f"/>
</svg>`);

const titleLeft = Math.round((w - title.width) / 2);
const titleTop = 84 + Math.round((54 - title.height) / 2);
const crumbLeft = 262;
const crumbTop = 26 + Math.round((12 - crumb.height) / 2);

const outDir = path.dirname(path.resolve(outPdf));
const outPng = path.join(outDir, path.basename(outPdf, '.pdf') + '.png');
fs.mkdirSync(outDir, { recursive: true });

await sharp(input)
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: crumb.png, top: crumbTop, left: crumbLeft },
    { input: title.png, top: titleTop, left: titleLeft },
  ])
  .png()
  .toFile(outPng);

const pdfPath = await ocrImageToPdf({
  inputPath: outPng,
  outPath: path.resolve(outPdf),
  lang: 'eng',
});

console.log('Font titre : Fira Mono (skills.sh)');
console.log(`PNG saved: ${outPng}`);
console.log(`PDF saved: ${pdfPath}`);
