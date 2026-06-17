import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pdfPath = 'file:///' + path.join(root, 'Kaiser Styve - CV.pdf').replace(/\\/g, '/');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
await page.goto(pdfPath, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(root, 'assets', 'cv-ref.png'), fullPage: true });
console.log('screenshot done');
await browser.close();
