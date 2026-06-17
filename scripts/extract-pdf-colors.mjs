import fs from 'fs';
import path from 'path';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(fs.readFileSync('Kaiser Styve - CV.pdf'));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const ops = await page.getOperatorList();

const colors = [];
for (let i = 0; i < ops.fnArray.length; i++) {
  const fn = ops.fnArray[i];
  const args = ops.argsArray[i];
  if (fn === OPS.setFillRGBColor || fn === OPS.setStrokeRGBColor) {
    colors.push(args);
  }
  if (fn === OPS.setFillColorN || fn === OPS.setStrokeColorN) {
    colors.push(args);
  }
}

console.log('Unique RGB fills (sample):', JSON.stringify([...new Set(colors.map(JSON.stringify))].slice(0, 20).map(JSON.parse)));

// extract images
let imgIndex = 0;
const objs = page.objs;
const handler = {
  get(obj, prop) {
  }
};

// simpler: get viewport and text positions for layout
const text = await page.getTextContent();
const positions = text.items.filter(t => t.str.trim()).map(t => ({
  str: t.str.slice(0, 40),
  x: Math.round(t.transform[4]),
  y: Math.round(t.transform[5]),
  size: Math.round(t.height),
}));
console.log('Text positions sample:', positions.slice(0, 15));
console.log('Page size:', page.view);
