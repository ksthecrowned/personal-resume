---
name: cv-variant-builder
description: Génère des variantes complètes de CV français alignées sur une offre d'emploi, en mettant à jour data/variants/*.json sans toucher au design Figma (css/, layout). Utiliser quand l'utilisateur demande une variante de CV, une adaptation à une JD, l'optimisation ATS, ou la réécriture de contenu pour un poste cible.
---

# CV Variant Builder

Expert rédaction CV + conseil carrière, adapté au projet **Styve Maba — CV HTML/Figma**.

**Objectif :** produire des variantes complètes par offre d'emploi, en réutilisant le template visuel existant.

## Règles absolues

- **Ne jamais** regénérer un HTML/CSS standalone ni imposer le template générique (#003366, 微软雅黑).
- **Ne jamais** modifier `css/tokens.css`, `css/layout.css`, `css/print.css` sauf demande explicite.
- **Toujours** écrire le contenu en **français**.
- **Ne jamais** inventer de chiffres ou faits — utiliser des placeholders `[à compléter]` si l'utilisateur n'a pas fourni de métriques.
- **Ne jamais** ajouter de watermark ou mention de génération IA sur le CV.

## Fichiers du projet

| Fichier | Rôle |
|---------|------|
| `data/variants/default.json` | Variante de référence (baseline) |
| `data/variants/<slug>.json` | Une variante par offre / cible |
| `data/variants/manifest.json` | Index des variantes disponibles |
| `index.html` | Structure visuelle fixe (Figma) |
| `js/render.js` | Injection dynamique du contenu |
| `data/experiences.json` | Legacy — synchroniser avec `default.json` si modifié |

Schéma JSON détaillé : [reference.md](reference.md)  
Exemples de workflow : [examples.md](examples.md)

## Workflow — nouvelle variante pour une offre

### 1) Évaluation initiale

Lire **avant de poser des questions** :
- `data/variants/default.json` (contenu de base)
- JD / offre fournie par l'utilisateur
- Tout CV ou notes déjà fournis

Déterminer :
1. **Slug** — kebab-case, court, descriptif : `backend-nestjs`, `lead-fullstack-fintech`
2. **Poste cible** — titre affiché sous le nom
3. **Mots-clés ATS** — extraire de la JD (stack, soft skills, domaine)
4. **Angle éditorial** — quelles expériences/missions mettre en avant

### 2) Collecte (si manquant)

Champs obligatoires (déjà dans default sauf override) :
- Nom, contacts → ne pas dupliquer, laisser `index.html`

Champs à adapter par variante :
- `meta.targetRole`, `meta.pageTitle`, `profile.title`, `profile.summary`
- `skills[]` — dimensions recalibrées selon le poste
- `experiences[]` — summaries, missions, stacks réordonnés

Demander les **métriques quantifiables** si absentes :
- volume transactions, taille équipe, gains perf, utilisateurs, délais, etc.

### 3) Rédaction (français)

#### Principe : achievements > responsabilités

- ❌ « Développement de fonctionnalités mobiles avec Flutter »
- ✅ **Développement mobile cross-platform :** livraison de fonctionnalités temps réel (Flutter, React Native) pour une plateforme de livraison ; stabilisation des flux transactionnels critiques.

#### Format missions (obligatoire)

Chaque item de `missions` commence par **Thème :** (texte plain, pas de markdown HTML) :

```
Architecture backend : conception d'API NestJS pour flux transactionnels temps réel (Socket.IO), avec PostgreSQL et MySQL.
```

#### Compétences par type de poste

| Type cible | Dimensions prioritaires |
|-----------|-------------------------|
| Backend / Full-Stack | Architecture, APIs, BDD, temps réel, DevOps |
| Lead / Responsable projet | Leadership, delivery, architecture, stakeholders |
| Mobile | Flutter/RN, UX, perf, offline/sync |
| Fintech | Transactions, sécurité, intégrations paiement, conformité |
| Frontend | React/Next, perf, accessibilité, design systems |

Règles :
- Aligner les mots-clés JD sans bourrage
- Pas de compétences basiques (« Office », « Internet »)
- Langues dans un bloc skills, pas de section séparée

#### Priorisation expériences

| Années exp. | Stratégie |
|------------|-----------|
| ≤ 5 ans | 3–4 missions max par poste récent ; couper le reste |
| 6–10 ans | Mettre en avant 2 derniers postes ; résumer l'ancien |

Réordonner `stack` pour mettre les technos JD en premier.

### 4) Génération des fichiers

1. Copier structure depuis `default.json`
2. Créer `data/variants/<slug>.json`
3. Ajouter entrée dans `data/variants/manifest.json` :

```json
{
  "id": "<slug>",
  "label": "Titre lisible — Société ou type d'offre",
  "targetRole": "Intitulé poste cible",
  "createdAt": "YYYY-MM-DD",
  "previewUrl": "/?variant=<slug>"
}
```

4. Si la baseline change aussi → mettre à jour `default.json` et `data/experiences.json`

### 5) Livraison

Fournir à l'utilisateur :

**A. Lien de prévisualisation**
```
bun run preview
→ http://localhost:3000/?variant=<slug>
```

**B. Résumé des changements (3–5 bullets)**
- Poste cible et angle choisi
- Mots-clés JD intégrés
- Expériences re-priorisées
- Métriques manquantes signalées

**C. Conseils carrière (3–5 points, automatique)**

Perspective : hiring manager du poste visé (+1–2 niveaux). Ancrer chaque conseil dans le profil réel. Exemples :
- lacunes vs JD et comment les combler en entretien
- storylines à préparer (incidents prod, delivery, leadership)
- questions d'entretien probables pour ce poste

## Checklist finale

```
- [ ] JD analysée, mots-clés ATS identifiés
- [ ] data/variants/<slug>.json créé et JSON valide
- [ ] manifest.json mis à jour
- [ ] Missions au format « Thème : description »
- [ ] Aucun fait inventé ; placeholders explicites si besoin
- [ ] css/ non modifié
- [ ] Preview URL communiquée
- [ ] Résumé + conseils carrière fournis
```

## Commandes utiles

```bash
# Prévisualiser une variante
bun run preview
# Puis ouvrir http://localhost:3000/?variant=<slug>

# Valider le JSON (si jq disponible)
jq empty data/variants/<slug>.json
```

## Variantes multiples

Encourager une variante par cible significativement différente (backend pur vs lead vs mobile). Ne pas fusionner des angles incompatibles dans un seul fichier.

Pour lister les variantes existantes : lire `data/variants/manifest.json`.
