import fs from 'fs';
import { createCanvas } from 'canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const data = new Uint8Array(fs.readFileSync('Kaiser Styve - CV.pdf'));
const doc = await getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 2 });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport }).promise;
fs.mkdirSync('assets', { recursive: true });
fs.writeFileSync('assets/cv-ref.png', canvas.toBuffer('image/png'));
console.log('saved', viewport.width, 'x', viewport.height);
