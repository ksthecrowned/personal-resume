# CV HTML/CSS — Design Spec

**Date:** 2026-06-17  
**Auteur:** Kaiser Styve (avec assistance IA)  
**Statut:** Approuvé

## Objectif

Reproduire à la lettre le CV existant (référence Figma + PDF) en HTML/CSS pur, avec édition hybride (HTML direct + JSON pour les expériences) et export PDF fidèle via le navigateur.

## Contraintes validées

| Contrainte | Décision |
|------------|----------|
| Fidélité visuelle | Reproduction pixel-perfect du design Figma |
| Édition | HTML pour contenu statique ; JSON pour expériences/projets |
| Export PDF | Oui — via impression navigateur (A4, marges 0) |
| Prévisualisation écran | Oui — même fichier, simulation feuille A4 |
| Stack CSS | CSS pur + variables (pas Tailwind) |
| Build | Aucun build obligatoire |
| Source design | [Figma — Kaiser Styve CV](https://www.figma.com/design/a5r0BmmM6idmFAgBAae6dw/Kaiser-Styve---CV?node-id=4-4&m=dev) |
| Source contenu | `Kaiser Styve - CV.pdf` (texte de référence) |

## Approche retenue

**HTML + CSS pur + JSON** — pas de framework, pas de Tailwind. Un script JS minimal injecte les expériences depuis JSON au chargement.

## Architecture des fichiers

```
personal resume/
├── index.html              # Structure + contenu statique
├── data/
│   └── experiences.json    # Expériences, clients, projets, stacks
├── css/
│   ├── tokens.css          # Variables design (Figma Dev Mode)
│   ├── layout.css          # Grille, sections, composants
│   └── print.css           # Règles @page A4 et impression
├── assets/
│   ├── fonts/              # Polices locales (mêmes que Figma)
│   └── icons/              # SVG icônes (contact, compétences)
├── js/
│   └── render.js           # Injection JSON → DOM
├── docs/
│   └── superpowers/specs/  # Cette spec
└── README.md               # Mode d'emploi édition + export PDF
```

## Mise en page

- **Format :** A4 (210 × 297 mm), une page
- **Colonnes :** 2 colonnes fixes — gauche ~35 % (profil, contacts, compétences, formation), droite ~65 % (expériences)
- **Sections gauche :** Profil & Contacts, badges stats (+25 Projets, +5 ans), Compétences techniques (4 catégories), Formation, Certifications
- **Sections droite :** Expérience professionnelle (liste chronologique inverse)
- **Référence Figma :** frame `4:4` du fichier Kaiser-Styve---CV

## Modèle de contenu

### Contenu statique (`index.html`)

Édité directement dans le HTML :

- Identité : nom (KAISER STYVE), titre (FULL-STACK SOFTWARE ENGINEER)
- Résumé profil (paragraphe)
- Contacts : téléphone, adresse, email, LinkedIn, GitHub (avec icônes SVG)
- Badges : « +25 Projets », « +5 ans »
- Compétences techniques — 4 blocs :
  - Architecture & systèmes
  - Backend & services critiques
  - Infrastructure & déploiement
  - Interfaces & applications
- Formation : Licence II Sciences Économiques, Baccalauréat Série D
- Certifications : ZTM, Udemy (CSS/Sass, 50 Projects, Ethical Hacking)

### Contenu dynamique (`data/experiences.json`)

Édité dans le fichier JSON ; rendu par `render.js` :

```json
{
  "experiences": [
    {
      "role": "string — titre du poste",
      "company": "string — optionnel",
      "period": "string — ex. Février 2025 - Présent",
      "summary": "string — paragraphe d'introduction",
      "missions": ["string"],
      "clients": [{ "name": "string", "url": "string — optionnel" }],
      "projects": ["string"],
      "evolutions": ["string"],
      "stack": ["string"],
      "badge": "string — optionnel, ex. + 2 ans"
    }
  ]
}
```

**Règles de rendu :**

- `missions`, `clients`, `projects`, `evolutions`, `stack`, `badge` sont optionnels
- Un bloc n'est affiché que si le champ correspondant est non vide
- `stack` affiché avec préfixe « Stack : » et séparateur virgule
- `clients` : liens cliquables si `url` présent
- Ordre d'affichage dans chaque expérience : summary → missions → clients → projects → evolutions → stack

### Données initiales (depuis PDF)

Trois expériences à peupler :

1. **LRC GROUP** — Février 2025 - Présent — Full-Stack & Responsable Projets (Ride, DTMoney)
2. **Consultant** — Octobre 2023 - Février 2025 — clients XKS Group, Webtinix, Central BTP ; projets MyTélévision, D5News, etc.
3. **WEBTINIX** — Septembre 2021 - Octobre 2023 — évolutions Team Lead (2022), Adjoint DT (2023)

## Stratégie de styles

### `tokens.css`

Variables CSS extraites du mode Dev Figma :

- Couleurs : texte principal, texte secondaire, accents, fond, séparateurs
- Typographie : familles, tailles (nom, titre, section, corps, légende), graisses, interlignes
- Espacements : padding colonnes, gap sections, gap listes
- Dimensions : largeur page A4, ratio colonnes

### `layout.css`

- Reset minimal (box-sizing, marges body)
- Grille 2 colonnes CSS Grid ou Flexbox avec largeurs fixes
- Composants : `.section-title`, `.experience-card`, `.skill-block`, `.contact-item`, `.stat-badge`, `.stack-line`
- Icônes : SVG inline ou `<img>` depuis `assets/icons/`
- Prévisualisation écran : conteneur centré, `box-shadow` simulant une feuille

### `print.css`

```css
@page { size: A4; margin: 0; }
```

- `print-color-adjust: exact` sur éléments colorés
- Masquer éléments non imprimables (ombre écran, boutons éventuels)
- `page-break-inside: avoid` sur cartes d'expérience
- Dimensions en `mm` pour correspondre au Figma

### Polices et icônes

- Polices : téléchargées/exportées depuis Figma → `assets/fonts/` avec `@font-face`
- Icônes : SVG exportés depuis Figma (email, phone, location, LinkedIn, GitHub, catégories compétences)

## Script `render.js`

- Fetch `data/experiences.json` au `DOMContentLoaded`
- Pour chaque expérience, construire un fragment HTML conforme à la structure Figma
- Insérer dans `#experiences-container` (placeholder dans `index.html`)
- En cas d'erreur fetch (fichier ouvert en `file://`) : afficher message invitant à utiliser un serveur local (`npx serve .`)

## Export PDF

**Workflow utilisateur :**

1. Ouvrir `index.html` (de préférence via serveur local)
2. Ctrl+P (ou Cmd+P)
3. Destination : « Enregistrer en PDF »
4. Marges : Aucune
5. Échelle : 100 %
6. Graphiques d'arrière-plan : activés

Documenté dans `README.md` avec captures ou étapes détaillées.

## Édition au quotidien

| Modifier | Fichier |
|----------|---------|
| Profil, contacts, compétences, formation | `index.html` |
| Expériences, clients, projets, stacks | `data/experiences.json` |
| Couleurs, typo, espacements globaux | `css/tokens.css` |
| Structure, mise en page | `css/layout.css` |
| Règles d'impression | `css/print.css` |

**Prévisualisation :** `npx serve .` puis `http://localhost:3000`

## Hors scope

- Site web responsive multi-pages
- Génération PDF automatisée (Puppeteer/Playwright)
- Internationalisation / version anglaise
- CMS ou interface d'édition graphique
- Tailwind CSS
- Build pipeline (Webpack, Vite)

## Critères de succès

1. Visuellement indistinguable du PDF/Figma à l'œil nu (polices, couleurs, espacements)
2. Export PDF A4 sur une seule page sans débordement
3. Modification d'une expérience dans JSON reflétée après rechargement
4. Modification du profil dans HTML sans toucher au JSON
5. README permettant à un non-développeur d'exporter un PDF

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Figma MCP indisponible | Extraction manuelle via Dev Mode (copier CSS, exporter assets) |
| Polices non libres | Utiliser les mêmes familles via Google Fonts ou fichiers Figma |
| CORS sur `file://` | README recommande `npx serve .` |
| Débordement contenu sur 2 pages | Tester après chaque ajout ; `page-break-inside: avoid` |

## Prochaine étape

Après validation de cette spec → plan d'implémentation détaillé (writing-plans).
