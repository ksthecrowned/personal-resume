import path from 'path';
import { fileURLToPath } from 'url';
import {
  ocrImageToPdf,
  resolveOutputPath,
  validateInput,
} from './lib/ocr-to-pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function printHelp() {
  console.log(`Usage: bun run ocr:pdf -- <image> [options]

Convertit une image/scan en PDF recherchable (Tesseract OCR).

Options:
  --out <path>      Fichier PDF de sortie (défaut: exports/ocr/<nom>.pdf)
  --lang <code>     Langue OCR (défaut: eng, ex: fra, fra+eng)
  --preprocess      Améliore contraste et résolution avant OCR
  --help            Affiche cette aide

Exemple:
  bun run ocr:pdf -- "C:/Users/pc/Downloads/cert.jpg" --preprocess
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(args.includes('--help') ? 0 : 1);
  }

  let input = null;
  let out = null;
  let lang = 'eng';
  let preprocess = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--out') {
      out = args[++i];
    } else if (a === '--lang') {
      lang = args[++i];
    } else if (a === '--preprocess') {
      preprocess = true;
    } else if (!a.startsWith('-')) {
      input = a;
    } else {
      console.error(`Option inconnue : ${a}`);
      process.exit(1);
    }
  }

  if (!input) {
    console.error('Erreur : chemin image requis.');
    printHelp();
    process.exit(1);
  }

  return { input, out, lang, preprocess };
}

try {
  const { input, out, lang, preprocess } = parseArgs(process.argv);
  const inputPath = validateInput(input);
  const outPath = resolveOutputPath(inputPath, out, root);

  const pdfPath = await ocrImageToPdf({ inputPath, outPath, lang, preprocess });

  console.log(`PDF saved: ${pdfPath}`);
  console.log('Vérifiez la recherche (Ctrl+F) dans le PDF.');
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
