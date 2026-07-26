/**
 * Génère lettres de motivation + guide mails pour candidatures spontanées.
 * Usage: node scripts/generate-spontanees.mjs [--pdf] [--priority=haute|moyenne|all]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'spontanees.json');
const lettresDir = path.join(root, 'lettres');
const assetsDir = path.join(lettresDir, 'assets', 'spontanees');
const pdfScript = path.join(__dirname, 'generate-lettre-pdf.mjs');

const args = process.argv.slice(2);
const doPdf = args.includes('--pdf');
const priorityArg =
  args.find((a) => a.startsWith('--priority='))?.split('=')[1] || 'all';

const companies = JSON.parse(fs.readFileSync(dataPath, 'utf8')).filter((c) =>
  priorityArg === 'all' ? true : c.priority === priorityArg,
);

fs.mkdirSync(assetsDir, { recursive: true });

const bodies = {
  default: {
    p2: `Fort de plus de cinq ans d'expérience en développement full-stack et en lead technique, j'ai conçu et exploité des plateformes web et mobiles en production (e-commerce, SaaS, fintech). Stack principale : <strong>Node.js / NestJS, React / Next.js, Flutter</strong>, PostgreSQL/MySQL et AWS.`,
    p3: `Aujourd'hui responsable technique chez <strong>LRC Group</strong> (Ride, DTMoney), j'assure le pilotage produit/technique, la coordination d'équipes et la résolution d'incidents en production. Mon parcours en consulting et en agence (Team Lead, adjoint DT) m'a habitué à livrer des solutions robustes, documentées et orientées métier.`,
    p4: `Je réoriente activement mon parcours vers l'<strong>intelligence artificielle appliquée</strong> : intégration de LLM et d'agents dans des produits réels, automatisation de workflows et outillage développeur. Passionné d'<strong>open source</strong>, je m'appuie sur cette culture pour apprendre vite, partager et construire des solutions transparentes et réutilisables.`,
  },
  'responsable-it': {
    p2: `Fort de plus de cinq ans d'expérience, j'interviens sur le <strong>pilotage de systèmes d'information</strong>, le support P1/P2, l'exploitation de bases de données (PostgreSQL, MySQL), AWS et la sécurisation des applications en production.`,
    p3: `Chez <strong>LRC Group</strong>, je suis responsable technique de plateformes critiques (Ride, DTMoney) : coordination des équipes, stabilité, incidents et amélioration continue. En agence, j'ai encadré jusqu'à cinq développeurs en tant que Team Lead puis adjoint au Directeur Technique.`,
    p4: `Je m'oriente vers l'<strong>IA au service du SI</strong> : automatisation du support, assistants métier, analyse d'incidents et gains d'efficacité opérationnelle. Engagé dans l'<strong>open source</strong>, je privilégie des outils ouverts, documentés et maintenables pour accélérer la digitalisation sans dépendance opaque.`,
  },
  'charge-it-dev-web': {
    p2: `Fort de plus de cinq ans d'expérience, j'accompagne les entreprises sur le <strong>développement et la maintenance de sites web</strong>, les CMS (WordPress, Laravel), le support utilisateurs, ainsi que l'administration d'outils métiers (dont Odoo) et de bases de données MySQL/PostgreSQL.`,
    p3: `Mon parcours en consulting et en agence m'a permis de livrer et maintenir des plateformes pour des clients locaux et internationaux, tout en assurant assistance, documentation et évolutions. Chez <strong>LRC Group</strong>, je reste proche de l'exploitation et du support au quotidien.`,
    p4: `Je développe aujourd'hui une compétence forte autour de l'<strong>IA pratique</strong> (assistants, automatisation de tâches web/support, gains de productivité) et cultive une passion pour l'<strong>open source</strong> : veille, réutilisation de briques éprouvées et partage de bonnes pratiques.`,
  },
};

const letterCss = `
      :root {
        --color-primary: #1e1950;
        --color-accent: #f5a623;
        --page-w: 595.5pt;
        --page-h: 842.25pt;
        --pad: 52pt;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { font-size: 10.5pt; }
      body {
        min-height: 100vh; display: flex; justify-content: center; padding: 16px;
        background: #c8c8cc; font-family: "Inter", sans-serif; line-height: 1.55;
        color: var(--color-primary);
      }
      .letter-page {
        width: var(--page-w); min-height: var(--page-h); padding: var(--pad);
        background: #fff; box-shadow: 0 10px 40px rgba(30, 25, 80, 0.18);
      }
      .letter-header {
        display: flex; justify-content: space-between; gap: 24pt;
        margin-bottom: 28pt; padding-bottom: 14pt;
        border-bottom: 2pt solid var(--color-accent);
      }
      .letter-sender__name { font-size: 14pt; font-weight: 700; color: var(--color-primary); }
      .letter-sender__detail, .letter-recipient { margin-top: 4pt; font-size: 10pt; }
      .letter-recipient { text-align: right; max-width: 240pt; }
      .letter-recipient__logo {
        display: block; margin-left: auto; margin-bottom: 10pt;
        max-height: 44pt; max-width: 160pt; width: auto; object-fit: contain;
      }
      .letter-recipient__logo--missing { display: none; }
      .letter-recipient strong { display: block; font-size: 11pt; margin-bottom: 4pt; }
      .letter-object { margin: 22pt 0 18pt; font-weight: 700; }
      .letter-body p { margin-bottom: 12pt; text-align: justify; }
      .letter-sign { margin-top: 22pt; }
      .letter-sign__name { margin-top: 28pt; font-weight: 700; }
      @media print {
        body { background: none; padding: 0; }
        .letter-page { width: 210mm; min-height: 297mm; box-shadow: none; }
      }
      @page { size: A4; margin: 0; }
`;

async function downloadLogo(company) {
  const dest = path.join(assetsDir, `${company.id}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
    return { path: dest, ok: true };
  }

  const urls = [
    `https://logo.clearbit.com/${company.logoDomain}?size=256`,
    `https://www.google.com/s2/favicons?domain=${company.logoDomain}&sz=128`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CV-Generator/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) continue;
      fs.writeFileSync(dest, buf);
      return { path: dest, ok: true };
    } catch {
      /* try next */
    }
  }
  return { path: dest, ok: false };
}

function buildHtml(company, logoOk) {
  const body = bodies[company.cv];
  const logoSrc = logoOk
    ? `assets/spontanees/${company.id}.png`
    : '';
  const logoBlock = logoOk
    ? `<img class="letter-recipient__logo" src="${logoSrc}" alt="${company.name}" />`
    : '';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Styve Maba — Lettre ${company.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700&display=swap" rel="stylesheet" />
    <style>${letterCss}</style>
  </head>
  <body>
    <main class="letter-page">
      <header class="letter-header">
        <div class="letter-sender">
          <p class="letter-sender__name">Styve Maba</p>
          <p class="letter-sender__detail">Pointe-Noire, Congo-Brazzaville</p>
          <p class="letter-sender__detail">(+242) 06 515 23 74</p>
          <p class="letter-sender__detail">kaiserstyve2@gmail.com</p>
          <p class="letter-sender__detail">linkedin.com/in/kaiser-styve</p>
        </div>
        <div class="letter-recipient">
          ${logoBlock}
          <strong>${company.name}</strong>
          Service Recrutement / RH<br />
          ${company.location}
        </div>
      </header>

      <p class="letter-object">
        Objet : Candidature spontanée — ${company.role}
      </p>

      <div class="letter-body">
        <p>Madame, Monsieur,</p>

        <p>
          Actuellement basé à Pointe-Noire, je me permets de vous adresser ma
          candidature spontanée au sein de <strong>${company.name}</strong>.
          Votre position dans le secteur ${company.sector} et les enjeux liés à
          ${company.hook} correspondent à mon parcours et à mon souhait
          d'évolution.
        </p>

        <p>${body.p2}</p>

        <p>${body.p3}</p>

        <p>${body.p4}</p>

        <p>
          Disponible immédiatement, je serais heureux de mettre cette expérience
          au service de ${company.name}. Vous trouverez en pièce jointe mon CV ;
          je reste à votre disposition pour un entretien.
        </p>

        <p>
          Je vous prie d'agréer, Madame, Monsieur, l'expression de ma
          considération distinguée.
        </p>
      </div>

      <footer class="letter-sign">
        <p>Pointe-Noire, le 26 juillet 2026</p>
        <p class="letter-sign__name">Styve Maba</p>
      </footer>
    </main>
  </body>
</html>
`;
}

function mailTemplate(cv) {
  const roles = {
    default: 'Ingénieur Full-Stack & Lead Technique',
    'responsable-it': 'Responsable Informatique',
    'charge-it-dev-web': 'Chargé IT & Développement Web',
  };
  const snippets = {
    default: `Fort de +5 ans d'expérience full-stack (NestJS, React/Next.js, Flutter, AWS), je pilote des plateformes en production chez LRC Group et j'ai encadré des équipes en agence. Je m'oriente activement vers l'IA appliquée (LLM, agents) et cultive une forte passion pour l'open source.`,
    'responsable-it': `Fort de +5 ans d'expérience en SI, support P1/P2, bases de données et AWS, je pilote des plateformes critiques en production. Je m'oriente vers l'IA au service du SI (automatisation, assistants métier) et m'appuie sur l'open source pour des outils durables.`,
    'charge-it-dev-web': `Fort de +5 ans d'expérience en développement web, CMS, support et outils métiers (dont Odoo). Je développe une compétence en IA pratique pour automatiser le quotidien IT/web, avec une passion marquée pour l'open source.`,
  };
  return {
    role: roles[cv],
    body: snippets[cv],
  };
}

function buildMailsMd(allCompanies) {
  const byCv = { default: [], 'responsable-it': [], 'charge-it-dev-web': [] };
  for (const c of allCompanies) byCv[c.cv].push(c);

  let md = `# Candidatures spontanées — Styve Maba

Date : 26 juillet 2026  
Objet demandé : \`Candidature spontanée\`

## Modèles de mail (corps)

`;

  for (const [cv, list] of Object.entries(byCv)) {
    if (!list.length) continue;
    const t = mailTemplate(cv);
    md += `### Variante CV \`${cv}\` — ${t.role}

\`\`\`
Objet : Candidature spontanée — ${t.role}

Madame, Monsieur,

Je me permets de vous adresser ma candidature spontanée pour un poste de ${t.role} au sein de [ENTREPRISE].

${t.body}

Vous trouverez en pièces jointes mon CV et ma lettre de motivation. Disponible immédiatement à Pointe-Noire, je reste à votre disposition pour un entretien.

Cordialement,
Styve Maba
(+242) 06 515 23 74
kaiserstyve2@gmail.com
linkedin.com/in/kaiser-styve
\`\`\`

Pièces jointes :
- \`exports/${cv}/fr/Styve Maba - CV.pdf\`
- \`lettres/Styve Maba - Lettre [Entreprise].pdf\`

Entreprises concernées : ${list.map((c) => c.name).join(', ')}

---

`;
  }

  md += `## Liste d'envoi

| Priorité | Entreprise | Email | CV | Lettre PDF |
|----------|------------|-------|-----|------------|
`;
  for (const c of allCompanies) {
    md += `| ${c.priority} | ${c.name} | ${c.email} | \`${c.cv}\` | Styve Maba - Lettre ${c.name}.pdf |\n`;
  }

  return md;
}

const logoResults = {};
console.log(`Generating ${companies.length} letters…`);

for (const company of companies) {
  const logo = await downloadLogo(company);
  logoResults[company.id] = logo.ok;
  const baseName = `Styve Maba - Lettre ${company.name}`;
  const htmlPath = path.join(lettresDir, `${baseName}.html`);
  fs.writeFileSync(htmlPath, buildHtml(company, logo.ok), 'utf8');
  console.log(
    `  HTML ${company.id} (logo: ${logo.ok ? 'ok' : 'missing'})`,
  );

  if (doPdf) {
    const r = spawnSync(process.execPath, [pdfScript, baseName], {
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      console.error(`  PDF failed: ${baseName}`);
    }
  }
}

const all = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const mailsPath = path.join(lettresDir, 'mails-spontanees.md');
fs.writeFileSync(mailsPath, buildMailsMd(all), 'utf8');
console.log(`Mails guide: ${mailsPath}`);
console.log('Done.');
