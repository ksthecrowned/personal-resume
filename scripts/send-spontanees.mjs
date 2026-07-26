/**
 * Envoi SMTP des candidatures spontanées.
 *
 * Usage:
 *   node scripts/send-spontanees.mjs --from=chevron
 *   node scripts/send-spontanees.mjs --priority=moyenne --dry-run
 *   node scripts/send-spontanees.mjs --id=mtn,airtel
 *
 * Requires .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'spontanees.json');
const lettresDir = path.join(root, 'lettres');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fromId = args.find((a) => a.startsWith('--from='))?.split('=')[1];
const priority = args.find((a) => a.startsWith('--priority='))?.split('=')[1];
const idsArg = args.find((a) => a.startsWith('--id='))?.split('=')[1];
const delayMs = Number(
  args.find((a) => a.startsWith('--delay='))?.split('=')[1] || 2500,
);

const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }
}

const smtpPass = process.env.SMTP_PASS.replace(/\s+/g, '');
if (
  process.env.SMTP_HOST?.includes('gmail') &&
  smtpPass.length !== 16
) {
  console.error(
    `Gmail app password should be 16 characters (got ${smtpPass.length} after removing spaces).\n` +
      'Create one at https://myaccount.google.com/apppasswords and paste all 4 groups.',
  );
  process.exit(1);
}

const mailBodies = {
  default: {
    role: 'Ingénieur Full-Stack & Lead Technique',
    text: `Fort de +5 ans d'expérience full-stack (NestJS, React/Next.js, Flutter, AWS), je pilote des plateformes en production chez LRC Group et j'ai encadré des équipes en agence. Je m'oriente activement vers l'IA appliquée (LLM, agents) et cultive une forte passion pour l'open source.`,
  },
  'responsable-it': {
    role: 'Responsable Informatique',
    text: `Fort de +5 ans d'expérience en SI, support P1/P2, bases de données et AWS, je pilote des plateformes critiques en production. Je m'oriente vers l'IA au service du SI (automatisation, assistants métier) et m'appuie sur l'open source pour des outils durables.`,
  },
  'charge-it-dev-web': {
    role: 'Chargé IT & Développement Web',
    text: `Fort de +5 ans d'expérience en développement web, CMS, support et outils métiers (dont Odoo). Je développe une compétence en IA pratique pour automatiser le quotidien IT/web, avec une passion marquée pour l'open source.`,
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function selectCompanies(all) {
  let list = [...all].filter((c) => !c.skipSend);
  if (idsArg) {
    const set = new Set(idsArg.split(',').map((s) => s.trim()));
    list = list.filter((c) => set.has(c.id));
  }
  if (priority) {
    list = list.filter((c) => c.priority === priority);
  }
  if (fromId) {
    const idx = all.findIndex((c) => c.id === fromId);
    if (idx < 0) {
      console.error(`Unknown --from id: ${fromId}`);
      process.exit(1);
    }
    const allowed = new Set(all.slice(idx).map((c) => c.id));
    list = list.filter((c) => allowed.has(c.id));
  }
  return list;
}

function buildMessage(company) {
  const body = mailBodies[company.cv];
  const subject = `Candidature spontanée — ${body.role}`;
  const text = `Madame, Monsieur,

Je me permets de vous adresser ma candidature spontanée pour un poste de ${body.role} au sein de ${company.name}.

${body.text}

Vous trouverez en pièces jointes mon CV et ma lettre de motivation. Disponible immédiatement à Pointe-Noire, je reste à votre disposition pour un entretien.

Cordialement,
Styve Maba
(+242) 06 515 23 74
kaiserstyve2@gmail.com
linkedin.com/in/kaiser-styve
`;

  const cvPath = path.join(
    root,
    'exports',
    company.cv,
    'fr',
    'Styve Maba - CV.pdf',
  );
  const letterPath = path.join(
    lettresDir,
    `Styve Maba - Lettre ${company.name}.pdf`,
  );

  for (const p of [cvPath, letterPath]) {
    if (!fs.existsSync(p)) {
      throw new Error(`Missing attachment: ${p}`);
    }
  }

  return {
    from: `"Styve Maba" <${process.env.SMTP_USER}>`,
    to: company.email,
    subject,
    text,
    attachments: [
      {
        filename: `Styve Maba - CV.pdf`,
        path: cvPath,
      },
      {
        filename: `Styve Maba - Lettre ${company.name}.pdf`,
        path: letterPath,
      },
    ],
  };
}

const all = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const companies = selectCompanies(all);

if (!companies.length) {
  console.error('No companies matched filters.');
  process.exit(1);
}

console.log(
  `${dryRun ? 'DRY-RUN' : 'SEND'} ${companies.length} mail(s): ${companies.map((c) => c.id).join(', ')}`,
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: smtpPass,
  },
});

if (!dryRun) {
  await transporter.verify();
  console.log('SMTP OK');
}

const results = [];
for (const company of companies) {
  const msg = buildMessage(company);
  if (dryRun) {
    console.log(`  [dry] ${company.name} → ${company.email}`);
    results.push({ id: company.id, ok: true, dry: true });
    continue;
  }
  try {
    const info = await transporter.sendMail(msg);
    console.log(`  OK ${company.id} → ${company.email} (${info.messageId})`);
    results.push({ id: company.id, ok: true, messageId: info.messageId });
  } catch (err) {
    console.error(`  FAIL ${company.id}: ${err.message}`);
    results.push({ id: company.id, ok: false, error: err.message });
  }
  if (delayMs > 0) await sleep(delayMs);
}

const failed = results.filter((r) => !r.ok);
console.log(
  `Done. ${results.length - failed.length}/${results.length} sent.`,
);
process.exit(failed.length ? 1 : 0);
