import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const url = process.env.CV_URL || 'http://localhost:3000/?variant=default&lang=fr';
const outPath = path.join(root, 'Kaiser Styve - CV.pdf');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('#cv-page', { state: 'visible' });
await page.waitForTimeout(500);

// Keep the same visual context as the PNG preview capture.
await page.addStyleTag({
  content: `
    .preview-toolbar { display: none !important; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    #cv-page {
      margin: 0 !important;
    }
    @page {
      margin: 0;
    }
  `,
});

const cv = page.locator('#cv-page');
const box = await cv.boundingBox();
if (!box) {
  throw new Error('Impossible de localiser #cv-page pour générer le PDF.');
}

// Render DOM directly so text remains selectable in PDF.
await page.emulateMedia({ media: 'screen' });
await page.pdf({
  path: outPath,
  width: `${Math.ceil(box.width)}px`,
  height: `${Math.ceil(box.height)}px`,
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
});

console.log(`PDF saved: ${outPath}`);
await browser.close();
