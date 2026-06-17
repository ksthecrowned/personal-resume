import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const url = process.env.CV_URL || 'http://localhost:3000/?variant=default&lang=fr';
const outPath = path.join(root, 'assets', 'cv-preview.png');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('#cv-page', { state: 'visible' });
await page.waitForTimeout(500);

// Masquer la barre d'outils preview pour un rendu propre
await page.addStyleTag({
  content: '.preview-toolbar { display: none !important; } body { background: #e0e0e4; padding: 24px; }',
});

const cv = page.locator('#cv-page');
await cv.screenshot({ path: outPath, type: 'png' });

console.log(`Screenshot saved: ${outPath}`);
await browser.close();
