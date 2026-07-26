# JobForge (Phase 1)

Atelier candidature Congo-first : coller une offre → score de match → brouillon de lettre (FR).

## Stack

- Next.js 15 (App Router) — port `3001`
- PostgreSQL + Prisma
- Auth.js (credentials)
- Cloudflare Workers AI (`AI_MODE=cloudflare`) ou mocks (`AI_MODE=mock`)

## Setup

1. Copier `.env.example` → `.env.local` (ou `.env`)
2. Renseigner `DATABASE_URL` (AlwaysData PostgreSQL recommandé)
3. Générer `AUTH_SECRET` (`openssl rand -base64 32`)
4. Installer et migrer :

```bash
cd jobforge
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Ouvrir [http://localhost:3001](http://localhost:3001).

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Dev serveur :3001 |
| `npm test` | Vitest |
| `npm run db:push` | Appliquer le schéma Prisma |
| `npm run db:studio` | Explorer la DB |

## Scope Phase 1

Inclus : inscription, profil, offre → match → lettre (mock/CF AI).

Hors scope (Phase 2+) : OAuth Gmail/Outlook envoi, R2, PDF templates, annuaire entreprises.

## Spec / plan

- Spec : `docs/superpowers/specs/2026-07-26-jobforge-saas-design.md`
- Plan : `docs/superpowers/plans/2026-07-26-jobforge-phase1-foundation.md`
