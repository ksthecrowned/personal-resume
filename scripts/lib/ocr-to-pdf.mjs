import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';

const SUPPORTED_EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);

const TESSERACT_CANDIDATES = [
  'tesseract',
  'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
  'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
];

function resolveTesseractCommand() {
  for (const candidate of TESSERACT_CANDIDATES) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (!result.error && result.status === 0) {
      return candidate;
    }
  }
  return null;
}

export function validateInput(inputPath) {
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Fichier introuvable : ${resolved}`);
  }
  const ext = path.extname(resolved).toLowerCase();
  if (!SUPPORTED_EXT.has(ext)) {
    throw new Error(
      `Extension non supportée : ${ext}. Formats acceptés : ${[...SUPPORTED_EXT].join(', ')}`,
    );
  }
  return resolved;
}

export function resolveOutputPath(inputPath, outPath, root) {
  if (outPath) return path.resolve(outPath);
  const basename = path.basename(inputPath, path.extname(inputPath));
  return path.join(root, 'exports', 'ocr', `${basename}.pdf`);
}

export function ensureTesseract() {
  const cmd = resolveTesseractCommand();
  if (!cmd) {
    throw new Error(
      'Tesseract OCR introuvable dans le PATH.\n' +
        'Installez-le : https://github.com/UB-Mannheim/tesseract/wiki\n' +
        'Puis vérifiez : tesseract --version',
    );
  }
  return cmd;
}

export async function preprocessImage(inputPath) {
  const sharp = (await import('sharp')).default;
  const meta = await sharp(inputPath).metadata();
  let pipeline = sharp(inputPath).grayscale().normalize();
  if (meta.width && meta.width < 1500) {
    const scale = Math.ceil(1500 / meta.width);
    pipeline = pipeline.resize(meta.width * scale, null, { kernel: 'lanczos3' });
  }
  const tmpPath = path.join(
    os.tmpdir(),
    `ocr-preprocess-${Date.now()}${path.extname(inputPath)}`,
  );
  await pipeline.toFile(tmpPath);
  return tmpPath;
}

export async function ocrImageToPdf({ inputPath, outPath, lang = 'eng', preprocess = false }) {
  const resolvedInput = validateInput(inputPath);
  const tesseractCmd = ensureTesseract();

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  let ocrInput = resolvedInput;
  let tmpFile = null;

  try {
    if (preprocess) {
      tmpFile = await preprocessImage(resolvedInput);
      ocrInput = tmpFile;
    }

    const outputBase = outPath.replace(/\.pdf$/i, '');
    const result = spawnSync(
      tesseractCmd,
      [ocrInput, outputBase, '-l', lang, 'pdf'],
      { encoding: 'utf8' },
    );

    if (result.status !== 0) {
      const msg = (result.stderr || result.stdout || '').trim();
      if (/Error opening data file|Failed loading language/i.test(msg)) {
        throw new Error(
          `Langue Tesseract "${lang}" non installée.\n` +
            `Réinstallez Tesseract avec le pack de langue ou choisissez --lang eng.\n${msg}`,
        );
      }
      throw new Error(`Échec Tesseract (code ${result.status}) :\n${msg}`);
    }

    if (!fs.existsSync(outPath)) {
      throw new Error(`PDF attendu non créé : ${outPath}`);
    }

    return outPath;
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}
