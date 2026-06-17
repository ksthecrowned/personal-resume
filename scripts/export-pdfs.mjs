import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportCvPdf } from './lib/export-cv-pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const variantsDir = path.join(root, 'data', 'variants');
const exportsDir = path.join(root, 'exports');
const baseUrl = process.env.CV_BASE_URL || 'http://localhost:3000';
const pdfFileName = 'Styve Maba - CV.pdf';

function loadManifest() {
  const manifestPath = path.join(variantsDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.variants.map((entry) => entry.id);
}

function loadLocales(variantId) {
  const variantPath = path.join(variantsDir, `${variantId}.json`);
  const variant = JSON.parse(fs.readFileSync(variantPath, 'utf8'));
  return variant.meta?.availableLocales || ['fr'];
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

const variantIds = loadManifest();
const generated = [];

for (const variantId of variantIds) {
  const locales = loadLocales(variantId);

  for (const lang of locales) {
    const outPath = path.join(exportsDir, variantId, lang, pdfFileName);
    await exportCvPdf(page, { baseUrl, variant: variantId, lang, outPath });
    generated.push(path.relative(root, outPath));
    console.log(`PDF saved: ${outPath}`);
  }
}

await browser.close();

console.log(`\n${generated.length} PDF(s) exported to exports/`);
