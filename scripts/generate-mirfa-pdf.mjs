import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const cvDir = path.join(root, 'cv-mirfa-kouamala');

const baseName = process.argv[2] || process.env.CV_BASE;
if (!baseName) {
  console.error(
    'Usage: node scripts/generate-mirfa-pdf.mjs "<nom de base>"\n' +
      'Exemple: node scripts/generate-mirfa-pdf.mjs "Mirfa Kouamala - CV Caissière"',
  );
  process.exit(1);
}

const htmlPath = path.join(cvDir, `${baseName}.html`);
const outPath = process.env.CV_OUT || path.join(cvDir, `${baseName}.pdf`);
const selector = baseName.includes('Lettre') ? '.letter-page' : '.cv-page';

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML introuvable : ${htmlPath}`);
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 900, height: 1200 },
  deviceScaleFactor: 2,
});

await page.goto(pathToFileURL(htmlPath).href, {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.waitForSelector(selector, { state: 'visible' });
await page.waitForTimeout(500);
await page.emulateMedia({ media: 'print' });

fs.mkdirSync(path.dirname(outPath), { recursive: true });

await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
});

await browser.close();
console.log(`PDF saved: ${outPath}`);
