# Schéma — data/variants/*.json

## Structure complète

```json
{
  "meta": {
    "id": "backend-nestjs",
    "label": "Backend NestJS — Startup fintech",
    "defaultLocale": "fr",
    "availableLocales": ["fr", "en"],
    "createdAt": "2026-06-17",
    "notes": "Optionnel — contexte interne pour l'agent"
  },
  "locales": {
    "fr": {
      "meta": {
        "pageTitle": "Styve Maba — CV Backend",
        "targetRole": "Développeur Backend Senior"
      },
      "identity": { "name": "Styve Maba", "photoAlt": "Styve Maba" },
      "profile": { "title": "...", "summary": "..." },
      "stats": [{ "value": "+25", "label": "Projets" }, { "type": "accent" }, { "value": "+5ans", "label": "D'experience", "color": "gray" }],
      "contacts": [{ "type": "email", "href": "mailto:...", "text": "...", "icon": "contact-email.svg" }],
      "skills": [{ "icon": "grid", "title": "...", "items": ["..."] }],
      "hobbies": [{ "icon": "hobby-programmation.svg", "label": "..." }],
      "education": [{ "title": "...", "place": "..." }],
      "certifications": ["..."],
      "experiences": [{ "role": "...", "period": "...", "badge": "En cours", "badgeType": "active" }]
    },
    "en": { }
  }
}
```

Libellés UI partagés (titres de section, « Missions : », etc.) : `data/i18n/<locale>.json`.

Prévisualisation : `/?variant=<slug>&lang=fr`

## Champs `meta`

| Champ | Requis | Description |
|-------|--------|-------------|
| `id` | oui | Identique au nom de fichier sans `.json` |
| `label` | oui | Libellé humain pour le manifest |
| `targetRole` | oui | Sous-titre sous le nom (`.identity__title`) |
| `pageTitle` | oui | Balise `<title>` |
| `jdKeywords` | non | Mots-clés ATS extraits de la JD |
| `createdAt` | oui | ISO date |
| `notes` | non | Notes agent, non affichées |

## Icônes skills (`icon`)

Valeurs supportées par `render.js` :

| Valeur | Usage typique |
|--------|---------------|
| `grid` | Architecture, systèmes |
| `code` | Backend, APIs |
| `server` | Infrastructure, DevOps |
| `monitor` | Frontend, interfaces |

## Champs expérience

Tous optionnels sauf `role`, `period`.

| Champ | Rendu |
|-------|-------|
| `company` | Concaténé avec `role` : `ROLE - COMPANY` |
| `summary` | Paragraphe intro |
| `missions` | Liste « Missions : » |
| `clients` | Liste liens « Clients principaux : » |
| `projects` | Liste « Projets majeurs : » |
| `evolutions` | Liste « Evolutions : » |
| `stack` | Ligne « Stack : … » |
| `badge` | Badge coin carte ; `En cours` → style actif |

## manifest.json

```json
{
  "variants": [
    {
      "id": "default",
      "label": "CV par défaut — Full-Stack",
      "targetRole": "Développeur Full-Stack",
      "createdAt": "2026-06-17",
      "previewUrl": "/?variant=default"
    }
  ]
}
```

## Sections non variantées

Tout le contenu affiché provient du JSON (`locales` + `data/i18n`). `index.html` ne contient que la coquille et les conteneurs vides.

## Slug — conventions

- minuscules, tirets : `lead-fullstack-fintech`
- inclure le différenciateur : `mobile-flutter`, pas `cv-2`
- max ~40 caractères
