import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportCvPdf } from './lib/export-cv-pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const baseUrl = process.env.CV_BASE_URL || 'http://localhost:3000';
const variant = process.env.CV_VARIANT || 'default';
const lang = process.env.CV_LANG || 'fr';
const outPath =
  process.env.CV_OUT ||
  path.join(root, 'Kaiser Styve - CV.pdf');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

await exportCvPdf(page, { baseUrl, variant, lang, outPath });

console.log(`PDF saved: ${outPath}`);
await browser.close();
