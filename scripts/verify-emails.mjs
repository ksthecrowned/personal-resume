/**
 * Vérifie les emails de data/spontanees.json
 *
 * Niveaux :
 *   1. syntaxe
 *   2. MX DNS (domaine reçoit du mail ?)
 *   3. --smtp : handshake RCPT TO (indicatif — pas 100 % fiable)
 *
 * Usage:
 *   node scripts/verify-emails.mjs
 *   node scripts/verify-emails.mjs --smtp
 *   node scripts/verify-emails.mjs --from=chevron --smtp
 */
import dns from 'dns/promises';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'spontanees.json');
const outPath = path.join(root, 'data', 'email-verification.json');

const args = process.argv.slice(2);
const doSmtp = args.includes('--smtp');
const fromId = args.find((a) => a.startsWith('--from='))?.split('=')[1];
const concurrency = Number(
  args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || 3,
);

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function resolveMx(domain) {
  try {
    const rows = await dns.resolveMx(domain);
    return {
      ok: true,
      hosts: rows
        .sort((a, b) => a.priority - b.priority)
        .map((r) => r.exchange),
    };
  } catch (err) {
    return { ok: false, hosts: [], error: err.code || err.message };
  }
}

function smtpRcpt(host, email, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port: 25 });
    let buf = '';
    let step = 0;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        sock.end();
      } catch {
        /* ignore */
      }
      sock.destroy();
      resolve(result);
    };

    const timer = setTimeout(
      () => finish({ accepted: null, code: 'TIMEOUT', detail: 'timeout' }),
      timeoutMs,
    );

    const send = (line) => {
      sock.write(`${line}\r\n`);
    };

    sock.setEncoding('utf8');
    sock.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split(/\r?\n/).filter((l) => l.length > 0);
      const last = lines.at(-1) || '';
      if (!/^\d{3}/.test(last)) return;
      const code = Number(last.slice(0, 3));

      if (step === 0) {
        if (code >= 200 && code < 400) {
          step = 1;
          send('EHLO local.verify');
        } else finish({ accepted: false, code, detail: last.slice(0, 160) });
      } else if (step === 1) {
        if (code >= 200 && code < 400) {
          step = 2;
          send('MAIL FROM:<>');
        } else finish({ accepted: false, code, detail: last.slice(0, 160) });
      } else if (step === 2) {
        if (code >= 200 && code < 400) {
          step = 3;
          send(`RCPT TO:<${email}>`);
        } else finish({ accepted: false, code, detail: last.slice(0, 160) });
      } else if (step === 3) {
        finish({
          accepted: code === 250 || code === 251,
          code,
          detail: last.slice(0, 160),
        });
      }
    });

    sock.on('error', (err) =>
      finish({ accepted: null, code: 'CONN', detail: err.message }),
    );
  });
}

function verdict(row) {
  if (!row.syntaxOk) return 'invalid_syntax';
  if (!row.mxOk) return 'no_mx';
  if (!doSmtp) return 'domain_ok';
  const detail = `${row.smtp?.detail || ''}`.toLowerCase();
  if (
    detail.includes('spamhaus') ||
    detail.includes('reputation') ||
    detail.includes('blocked using') ||
    detail.includes('listed by')
  ) {
    return 'blocked_ip';
  }
  if (
    detail.includes('user unknown') ||
    detail.includes('5.1.1') ||
    detail.includes('does not exist') ||
    detail.includes('no such user')
  ) {
    return 'likely_missing';
  }
  if (row.smtp?.accepted === true) return 'likely_ok';
  if (row.smtp?.accepted === false) return 'smtp_reject';
  return 'unknown';
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return out;
}

let companies = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
if (fromId) {
  const idx = companies.findIndex((c) => c.id === fromId);
  if (idx < 0) {
    console.error(`Unknown --from=${fromId}`);
    process.exit(1);
  }
  companies = companies.slice(idx);
}

console.log(
  `Verifying ${companies.length} email(s)${doSmtp ? ' (MX + SMTP RCPT)' : ' (syntax + MX only)'}…`,
);

const results = await mapPool(companies, concurrency, async (company) => {
  const email = (company.email || '').trim();
  const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
  const syntaxOk = EMAIL_RE.test(email);
  const mx = syntaxOk
    ? await resolveMx(domain)
    : { ok: false, hosts: [], error: 'skip' };

  let smtp = null;
  if (doSmtp && syntaxOk && mx.ok && mx.hosts[0]) {
    smtp = await smtpRcpt(mx.hosts[0], email);
    // polite pacing
    await sleep(200);
  }

  const row = {
    id: company.id,
    name: company.name,
    email,
    domain,
    priority: company.priority,
    cv: company.cv,
    syntaxOk,
    mxOk: Boolean(mx.ok),
    mxHosts: mx.hosts?.slice(0, 3) || [],
    mxError: mx.error || null,
    smtp,
  };
  row.verdict = verdict(row);
  console.log(
    `  ${row.verdict.padEnd(16)} ${email}${smtp ? ` [${smtp.code}]` : ''}`,
  );
  return row;
});

const summary = results.reduce((acc, r) => {
  acc[r.verdict] = (acc[r.verdict] || 0) + 1;
  return acc;
}, {});

const payload = {
  generatedAt: new Date().toISOString(),
  mode: doSmtp ? 'syntax+mx+smtp' : 'syntax+mx',
  disclaimer: doSmtp
    ? 'SMTP RCPT est indicatif : catch-all, greylist et politiques anti-spam peuvent fausser le résultat. Un 250 ne garantit pas la livraison ; un rejet 5xx est un signal fort.'
    : 'Sans --smtp, seuls la syntaxe et les enregistrements MX du domaine sont vérifiés (pas l’existence de la boîte).',
  summary,
  results,
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(`\nWrote ${outPath}`);
console.log('Summary:', summary);
