import { chromium } from 'playwright-core';
import path from 'path';
import { pathToFileURL } from 'url';

export async function renderTextPng({ text, fontPath, fontSize, fontWeight = 400, color = '#ffffff' }) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 200 },
    deviceScaleFactor: 1,
  });

  const fontUrl = pathToFileURL(path.resolve(fontPath)).href.replace(/\\/g, '/');

  await page.setContent(`<!DOCTYPE html>
<html>
<head>
<style>
@font-face {
  font-family: 'RenderFont';
  src: url('${fontUrl}') format('truetype');
  font-weight: ${fontWeight};
}
html, body { margin: 0; padding: 0; background: transparent; }
#t {
  display: inline-block;
  font-family: 'RenderFont', monospace;
  font-size: ${fontSize}px;
  font-weight: ${fontWeight};
  color: ${color};
  white-space: nowrap;
  line-height: 1;
  letter-spacing: 0;
}
</style>
</head>
<body><div id="t">${text}</div></body>
</html>`);

  const el = page.locator('#t');
  await page.waitForTimeout(100);
  const box = await el.boundingBox();
  if (!box) {
    await browser.close();
    throw new Error('Impossible de mesurer le texte rendu.');
  }

  const png = await el.screenshot({ omitBackground: true });
  await browser.close();
  return { png, width: Math.ceil(box.width), height: Math.ceil(box.height) };
}
