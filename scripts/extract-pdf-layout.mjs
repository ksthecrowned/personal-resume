import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(fs.readFileSync('Kaiser Styve - CV.pdf'));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const text = await page.getTextContent();
const [,, w, h] = page.view;

for (const t of text.items) {
  if (!t.str.trim()) continue;
  const entry = {
    str: t.str.trim().slice(0, 50),
    x: Math.round(t.transform[4]),
    y: Math.round(h - t.transform[5]),
    size: Math.round(t.height * 10) / 10,
    w: Math.round(t.width),
  };
  if (/KAISER|STYVE|FULL-STACK SOFTWARE|Compétences|Stack|Missions|\+5|\+ 2/i.test(t.str)) {
    console.log(entry);
  }
}

console.log('---');
console.log('Page:', w, 'x', h);
console.log('Column split ~', Math.round(891 / w * 100), '%');
