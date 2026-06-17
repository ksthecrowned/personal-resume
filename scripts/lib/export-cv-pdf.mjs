import fs from 'fs';
import path from 'path';

const EXPORT_STYLES = `
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
`;

export async function exportCvPdf(page, { baseUrl, variant, lang, outPath }) {
  const url = `${baseUrl.replace(/\/$/, '')}/?variant=${encodeURIComponent(variant)}&lang=${encodeURIComponent(lang)}`;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#cv-page', { state: 'visible' });
  await page.waitForTimeout(500);

  await page.addStyleTag({ content: EXPORT_STYLES });

  const cv = page.locator('#cv-page');
  const box = await cv.boundingBox();
  if (!box) {
    throw new Error(`Impossible de localiser #cv-page (${variant}/${lang}).`);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

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
