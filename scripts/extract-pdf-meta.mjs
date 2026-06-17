import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(fs.readFileSync('Kaiser Styve - CV.pdf'));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const textContent = await page.getTextContent();
const fonts = new Set();
const colors = new Set();
for (const item of textContent.items) {
  if (item.fontName) fonts.add(item.fontName);
}
console.log('Fonts:', [...fonts]);
console.log('Sample items:', textContent.items.slice(0, 5).map(i => ({ str: i.str, font: i.fontName, height: i.height })));
