# Portfolio Styve Maba — Design Spec

**Date:** 2026-06-18  
**Auteur:** Styve Maba (avec assistance IA)  
**Statut:** En attente de revue utilisateur

## Objectif

Créer un portfolio web **moderne et mémorable** pour impressionner des **pairs développeurs**, dans un **nouveau repo Next.js** séparé du CV (`personal-resume`). Esthétique **glassmorphism + brutaliste** (approche « Brutal Shell, Glass Core »), bilingue FR/EN, multi-pages avec blog MDX complet et fiches projet détaillées.

## Contraintes validées

| Contrainte | Décision |
|------------|----------|
| Audience | Pairs dev & communauté tech (crédibilité, GitHub/LinkedIn) |
| Repo | **Nouveau repo** indépendant du CV |
| Stack | Next.js (App Router) |
| Langues | Bilingue FR/EN avec switcher (`next-intl`, routes `/fr/...` et `/en/...`) |
| Thème | Toggle dark/light (dark par défaut au premier chargement) |
| Navigation | **Multi-pages** — pas de one-page scroll |
| Blog | Complet — articles en **MDX local** versionnés dans le repo |
| Projets | Pages détail case study par projet (`/projects/[slug]`) |
| Contenu initial | Migré + enrichi depuis `personal-resume/data/variants/default.json` |
| Témoignages | Structure prête, placeholders `[à compléter]` |
| Déploiement | Vercel |
| Pipeline design | brainstorming → design-lab (5 variantes) → frontend-design (implémentation) |

## Approche retenue

**A — Brutal Shell, Glass Core**

- **Coque brutaliste** : typo display massive, grilles exposées, bordures épaisses, contrastes forts, numéros de section (`01`, `02`…), accents orange `#ff893a`.
- **Contenus en glass** : cartes projets, articles blog, skills et témoignages en panneaux `backdrop-filter` sur fond atmosphérique (mesh gradient + grain).
- Fusion glass + brutal explorée via **design-lab** sur Hero, ProjectCard et PostCard avant implémentation finale.

## Architecture des routes

```
app/[locale]/
├── page.tsx                    # Accueil — hero, stats, 3 projets phares, 3 derniers articles
├── about/page.tsx              # Bio, photo, hobbies, formation, certifications, témoignages
├── experience/page.tsx         # Timeline 3 expériences (missions + stack)
├── projects/
│   ├── page.tsx                # Grille tous les projets
│   └── [slug]/page.tsx         # Case study détaillée (MDX)
├── skills/page.tsx             # Compétences groupées + chips
├── blog/
│   ├── page.tsx                # Liste articles (tags, pagination)
│   └── [slug]/page.tsx         # Article MDX (TOC, syntax highlighting)
├── contact/page.tsx            # Coordonnées + liens sociaux
└── layout.tsx                  # Nav, footer, providers thème/langue
```

### Navigation

- Nav sticky : Accueil · Projets · Expérience · Blog · À propos · Contact
- Footer : liens secondaires, GitHub, LinkedIn
- Breadcrumbs sur pages profondes (`Projets / Ride`)

## Structure du repo

```
portfolio/
├── app/[locale]/               # Routes ci-dessus + __design_lab/ (temporaire)
├── components/
│   ├── sections/               # Hero, ProjectCard, PostCard, Timeline, etc.
│   ├── ui/                     # GlassCard, BrutalFrame, ThemeToggle, LangSwitcher, Prose
│   └── layout/                 # Nav, Footer, Breadcrumbs
├── content/
│   ├── blog/
│   │   ├── fr/*.mdx
│   │   └── en/*.mdx
│   ├── projects/
│   │   ├── fr/*.mdx
│   │   └── en/*.mdx
│   └── data/
│       ├── portfolio.fr.json
│       └── portfolio.en.json
├── lib/
│   ├── mdx.ts                  # Compilation MDX, extraction frontmatter
│   ├── content.ts              # Loaders blog, projets, JSON
│   └── i18n.ts
├── public/assets/              # Photo, icônes, textures, covers
└── docs/                       # Optionnel — README du repo
```

## Contenu par page

### Accueil (`/`)

| Bloc | Contenu |
|------|---------|
| Hero | Nom, titre, accroche orientée pairs dev, stats (+25 projets, +5 ans), CTA vers `/projects`, liens GitHub/LinkedIn |
| Projets phares | 3 cartes (Ride, DTMoney, MyTélévision/D5News) → lien vers fiche détail |
| Derniers articles | 3 posts récents du blog → lien vers `/blog/[slug]` |
| Témoignages | 1–2 citations (placeholders si besoin) |

### À propos (`/about`)

Bio enrichie (3–4 phrases, réécrite vs CV), photo, localisation Pointe-Noire, hobbies (veille tech, open source, bénévolat), formation, certifications, témoignages complets.

### Expérience (`/experience`)

Timeline verticale des 3 postes :

1. LRC GROUP — Ride & DTMoney (2025–présent)
2. Consultant — XKS Group, Webtinix (2023–2025)
3. WEBTIX — Team Lead / Adjoint DT (2021–2023)

Chaque entrée : rôle, période, résumé, missions condensées, stack chips, badge statut.

### Projets (`/projects` + `/projects/[slug]`)

**Liste** : grille de cartes glass avec titre, rôle, stack, métrique clé, lien détail.

**Fiches initiales** (MDX FR + EN) :

| Slug | Projet | Métriques clés (CV) |
|------|--------|---------------------|
| `ride` | Ride — livraison | +500 users, coordination full-stack |
| `dtmoney` | DTMoney — fintech | -70% incidents critiques, temps réel |
| `mytelevision` | MyTélévision / D5News | 100k+ utilisateurs |
| `ecommerce-clients` | Plateformes e-commerce clients | 10+ plateformes, multi-clients |

Structure case study MDX :

```yaml
---
title: string
description: string
role: string
period: string
stack: string[]
metrics: { label: string, value: string }[]
coverImage: string
published: boolean
---
```

Sections : Contexte · Rôle · Stack · Défis & solutions · Résultats · Liens (repo/demo si dispo).

### Skills (`/skills`)

3 groupes (Développement, Infrastructure, Langues) + certifications en liste secondaire. Chips interactifs au hover.

### Blog (`/blog` + `/blog/[slug]`)

Articles MDX locaux, un dossier par locale.

Frontmatter article :

```yaml
---
title: string
description: string
date: ISO8601
tags: string[]
coverImage: string
published: boolean
---
```

- **Liste** : cartes glass, tri par date, filtres par tag, pagination
- **Détail** : layout éditorial, titre brutal XXL, meta, TOC sticky, prose glass, syntax highlighting, navigation prev/next
- **v1** : 1 article exemple FR + 1 EN pour valider le pipeline

### Contact (`/contact`)

Email, téléphone, LinkedIn, GitHub. Pas de formulaire en v1 (mailto + liens externes).

## Données JSON (`content/data/portfolio.{fr,en}.json`)

Reprend et enrichit depuis `default.json` :

- `identity` (nom, photo)
- `profile` (titre, summary enrichi)
- `stats`
- `contacts`
- `skills`
- `experiences` (pour timeline)
- `education`, `certifications`, `hobbies`
- `testimonials` (placeholders)

## Direction visuelle

### Typographie

| Rôle | Police | Usage |
|------|--------|-------|
| Display brutal | **Syne** ou **Clash Display** | Hero, titres section, chiffres stats |
| Body | **DM Sans** ou **General Sans** | Texte courant, prose blog |

**Inter interdit** — éviter l'esthétique générique AI.

### Palette (héritée du CV, enrichie)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--color-primary` | `#1e1950` | Texte brutal light, fond accents |
| `--color-accent` | `#422fbd` | Mesh gradient, glow, liens |
| `--color-orange` | `#ff893a` | Highlights brutalistes |
| `--color-bg-dark` | `#0a0818` | Fond dark |
| `--color-bg-light` | `#f5f4f0` | Fond light |

### Glass utilities

- `backdrop-filter: blur(16px)`
- Fond `rgba(255,255,255,0.06)` (dark) / `rgba(30,25,80,0.04)` (light)
- Bordure `1px solid rgba(255,255,255,0.12)` (dark)
- Grain texture en overlay CSS

### Brutal utilities

- Bordures 2–3px sur nav, séparateurs, frames
- Grille exposée (lignes 1px)
- Numéros de section (`01`, `02`…)
- UPPERCASE / tracking serré sur titres

### Toggle dark / light

| Mode | Fond | Brutal | Glass |
|------|------|--------|-------|
| Dark (défaut) | Navy + mesh violet | Blanc pur | Panneaux semi-transparents clairs |
| Light | Off-white + mesh doux | Navy `#1e1950` | Panneaux semi-transparents foncés |

Transition 400ms sur couleurs et blur.

### Motion

- Entrée hero : stagger reveal (`animation-delay`)
- Scroll sections : fade-in + `translateY` via `Intersection Observer`
- Hover cartes : `scale(1.02)` + glow accent
- `prefers-reduced-motion` : désactiver animations non essentielles

## Design-lab — 5 variantes

Composants ciblés : **Hero**, **ProjectCard**, **PostCard**.

| Variant | Axe |
|---------|-----|
| A | Hiérarchie — hero brutal dominant, glass discret |
| B | Layout — grille bento brutal vs cartes glass empilées |
| C | Densité — sparse (beaucoup d'air) vs dense (info riche) |
| D | Interaction — modal glass vs expand inline brutal |
| E | Expressif — push max fusion glass + brutal |

Route temporaire : `app/[locale]/__design_lab/page.tsx`  
Cleanup obligatoire après validation (suppression `.claude-design/` et routes temp).

## SEO, perf, accessibilité

| Sujet | Implémentation |
|-------|----------------|
| SEO | `generateMetadata` par page ; OG images par article/projet |
| Static gen | `generateStaticParams` pour blog + projets |
| Images | `next/image`, WebP |
| A11y | Contraste WCAG AA, focus visible, sémantique HTML |
| i18n | `next-intl`, hreflang, locale dans l'URL |

## Hors scope v1

- Formulaire de contact backend
- CMS headless (Sanity, Contentful)
- Authentification / admin
- Commentaires blog
- Analytics (peut être ajouté plus tard via Vercel Analytics)

## Pipeline d'implémentation

```
1. ✅ Brainstorming + spec (ce document)
2. ⏳ Revue utilisateur de la spec
3. ⏳ Design-lab — 5 variantes Hero + ProjectCard + PostCard
4. ⏳ Choix variante + synthèse
5. ⏳ frontend-design — scaffold repo + implémentation complète
6. ⏳ Contenu : migration JSON + rédaction MDX projets/articles exemples
7. ⏳ Déploiement Vercel
```

## Références

- CV source : `personal-resume/data/variants/default.json`
- Spec CV existante : `docs/superpowers/specs/2026-06-17-cv-html-design.md`
- Skills : `design-lab`, `frontend-design`, `brainstorming`
