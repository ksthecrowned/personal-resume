import fs from 'fs';
import path from 'path';

const EXPORT_STYLES = `
  .preview-toolbar,
  .cv-page-guides { display: none !important; }
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
`;

const DENSE_UNCLIP_STYLES = `
  #cv-page.cv--dense,
  #cv-page.cv--dense.cv-page--clip {
    height: auto !important;
    max-height: none !important;
    min-height: 297mm !important;
    overflow: visible !important;
  }
`;

export async function exportCvPdf(page, { baseUrl, variant, lang, outPath }) {
  const url = `${baseUrl.replace(/\/$/, '')}/?variant=${encodeURIComponent(variant)}&lang=${encodeURIComponent(lang)}`;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#cv-page', { state: 'visible' });
  await page.waitForTimeout(500);

  await page.addStyleTag({ content: EXPORT_STYLES });

  const isDense = await page.locator('#cv-page.cv--dense').count();

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  if (isDense) {
    await page.evaluate(() => {
      const el = document.getElementById('cv-page');
      if (el) el.classList.remove('cv-page--clip');
    });
    await page.addStyleTag({ content: DENSE_UNCLIP_STYLES });
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const mod = await import(`${window.location.origin}/js/dense-page-breaks.mjs`);
      mod.alignDensePageBreaks();
    });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    return outPath;
  }

  const cv = page.locator('#cv-page');
  const box = await cv.boundingBox();
  if (!box) {
    throw new Error(`Impossible de localiser #cv-page (${variant}/${lang}).`);
  }

  await page.emulateMedia({ media: 'screen' });
  await page.pdf({
    path: outPath,
    width: `${Math.ceil(box.width)}px`,
    height: `${Math.ceil(box.height)}px`,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });

  return outPath;
}
