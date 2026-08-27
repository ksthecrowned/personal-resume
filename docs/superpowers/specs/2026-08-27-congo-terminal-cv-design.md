# CV + lettre Congo Terminal — Design Spec

**Date :** 2026-08-27  
**Statut :** Approuvé (design) — en attente plan d’implémentation  
**Candidat :** Styve Maba  
**Cible :** Congo Terminal (AGL), Pointe-Noire — candidature spontanée  
**Repo :** `personal-resume` (CV dynamique) — **pas** JobForge / Mirfa

## Objectif

Livrer un dossier **CV + lettre** pour une candidature spontanée chez Congo Terminal, en réutilisant le **CV dynamique** (`data/variants` + `js/render.js`), avec un mode densifié ATS-friendly (~1,5 page, max 2), sans template Mirfa.

## Contraintes validées

| Contrainte | Décision |
|------------|----------|
| Titre CV / objet lettre | Ingénieur Full-Stack · Systèmes d’information & projets |
| Angle | SI / digital ops + projets (pas SaaS produit pur, pas manager RH) |
| Longueur CV | ~1,5 page, max 2 |
| Template | CV dynamique existant + mode densifié — **pas Mirfa** |
| Périmètre | CV + lettre (FR uniquement) |
| Destinataire lettre | Congo Terminal — **Directeur Général** |
| Canal dépôt (info) | Portail AGL TalentSoft (candidature spontanée) — hors code |
| Contenu source | Dump Styve 2026-08-27 — draft validé |
| Chiffres | Strictement ceux du dump : 5+ ans ; 4+ sites vitrines ; 100 000+ téléchargements Play Store |
| Anglais affiché | courant à l’écrit, conversationnel à l’oral |
| Fichiers | `data/variants/congo-terminal.json` + `lettres/Styve Maba - Lettre Congo Terminal.html` |

## Hors scope

- JobForge / template Mirfa
- Version anglaise CV ou lettre
- Checklist / automatisation dépôt TalentSoft
- Inventer des métriques (ex. −70 % incidents, équipe de 5) absentes du dump
- Refonte globale du layout pour toutes les variantes
- Nouveau moteur PDF

## Documents liés

- Brief handoff : `docs/superpowers/specs/2026-08-27-congo-terminal-cv-brief.md`
- Contenu rédactionnel validé : `docs/superpowers/specs/2026-08-27-congo-terminal-cv-content-draft.md`

---

## Approche retenue

**Approche 2 — Variante JSON + mode densifié ATS**

1. Nouvelle variante `congo-terminal` (contenu = content draft).
2. Flags `meta.layout` pour densifier le rendu **uniquement** pour cette variante.
3. Mise à jour de la lettre HTML existante (DG + textes du draft).
4. Export via scripts PDF déjà présents dans le repo.

Rejetées : variante seule sans densification (risque de dépasser 2 pages) ; layout mono-colonne dédié (surcoût, double maintenance).

---

## Architecture

```
data/variants/congo-terminal.json   # contenu FR + meta.layout dense
data/variants/manifest.json         # enregistrement de la variante
js/render.js                        # lit meta.layout → classes body/page
css/layout.css (+ print si besoin)  # règles .cv--dense / hide-*
index.html                          # inchangé structurellement (IDs existants)
lettres/Styve Maba - Lettre Congo Terminal.html  # contenu mis à jour
```

**Preview :** `/?variant=congo-terminal&lang=fr`  
**Export CV :** scripts `export:pdf` / `generate-cv-pdf` existants avec variante.  
**Export lettre :** script lettre existant.

---

## Composants

### 1. Variante `congo-terminal.json`

- Schéma identique aux variantes actuelles (`locales.fr` : identity, profile, contacts, skills, experiences, education, certifications).
- Locale **fr uniquement** (`availableLocales: ["fr"]`).
- `stats` / `hobbies` : absents ou tableaux vides (masqués par layout dense).
- `meta.notes` : mots-clés ATS (SI, production, intégration, TPE/NFC, legacy, pilotage projets, Pointe-Noire).
- Textes = `2026-08-27-congo-terminal-cv-content-draft.md` (source de vérité rédactionnelle).

### 2. Mode densifié (`meta.layout`)

Structure proposée :

```json
"layout": {
  "dense": true,
  "hidePhoto": true,
  "hideHobbies": true,
  "hideStats": true
}
```

Comportement :

| Flag | Effet |
|------|--------|
| `dense` | Classe CSS densifiant marges / compétences / typo légère |
| `hidePhoto` | Masque le bloc photo |
| `hideHobbies` | Masque la section centres d’intérêt |
| `hideStats` | Masque la rangée de stats (+25 / +5 ans) |

Règles ATS : texte réel dans le DOM, titres de sections standards, contacts en clair, pas de texte critique dans des images. Les autres variantes sans `layout` restent inchangées.

### 3. Lettre

- Conserver le gabarit HTML/CSS actuel.
- Destinataire : Congo Terminal / À l’attention du Directeur Général / Pointe-Noire.
- Objet et corps : content draft.
- Formule : « Madame, Monsieur le Directeur Général ».
- Date : à actualiser au moment de l’export / envoi (`[date du jour]` dans le draft).

---

## Flux de données

1. Édition du JSON variante (+ sync éventuelle depuis le content draft).
2. Preview locale → contrôle longueur (~1,5–2 pages) et densification.
3. Export PDF CV (`variant=congo-terminal`).
4. Mise à jour / export PDF lettre.
5. Dépôt manuel sur AGL TalentSoft (hors repo).

## Erreurs & garde-fous

- Variante introuvable → fallback `default` (comportement actuel) ; à détecter en preview.
- `layout` absent ou invalide → layout normal, pas d’exception.
- Contenu trop long → raccourcir les bullets dans le JSON (pas de pagination automatique).
- Ne pas réintroduire de chiffres hors dump sans validation explicite.

## Vérification

- Preview FR + impression A4 (longueur, photo absente, hobbies/stats absents).
- Contrôle ATS basique : sélection de texte, titres, mots-clés SI/intégration/production.
- Manifest : `congo-terminal` listé dans le sélecteur preview.
- PDF CV + PDF lettre générés sans erreur.
- Pas de suite de tests automatisés obligatoire pour ce one-shot.

## Critères de succès

1. CV preview/PDF ≈ 1,5 page (≤ 2), lisible, ATS-friendly.
2. Contenu aligné sur le content draft (titre, anglais, chiffres stricts).
3. Lettre adressée au Directeur Général, objet cohérent avec le titre.
4. Autres variantes du CV dynamique non régressées.

---

## Ordre d’implémentation (indicatif — détail dans le plan)

1. Ajouter `meta.layout` + CSS/JS densifié (smoke sur une variante existante ou flag temporaire).
2. Créer `congo-terminal.json` + entrée manifest.
3. Réécrire la lettre HTML.
4. Preview / ajustements de densité.
5. Export PDF CV + lettre.
