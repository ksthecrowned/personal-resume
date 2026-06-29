import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, 'generate-mirfa-pdf.mjs');
const baseName = process.env.CV_BASE || 'Mirfa Kouamala - CV Caissière';

const result = spawnSync(process.execPath, [script, baseName], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
