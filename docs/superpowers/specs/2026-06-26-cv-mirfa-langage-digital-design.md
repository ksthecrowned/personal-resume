# CV Mirfa Kouamala — Langage Digital (Closer WhatsApp) — Design Spec

**Date:** 2026-06-26  
**Statut:** Approuvé  
**Offre:** [Chantier Vacances Digital 2026 — Langage Digital](https://www.facebook.com/share/1aZZJzodgS/)  
**Contact recrutement:** WhatsApp 069824366 · Dupinbusiness@gmail.com

## Objectif

Adapter le dossier `cv-mirfa-kouamala/` pour candidater au poste de **Closer WhatsApp en télétravail** (Croissance & Acquisition) chez **Langage Digital**, avec **CV pivoté vente digitale** + **lettre de motivation** prêts à envoyer (PDF).

## Contraintes validées

| Contrainte | Décision |
|------------|----------|
| Périmètre | CV + lettre de motivation (pas prep entretien) |
| Approche | Pivot complet du contenu (approche 1) |
| Outils clés | WhatsApp Business, Canva, Facebook — maîtrise confirmée |
| Langues | Français, Lingala (+ Kituba en bonus) |
| Âge | 25 ans (dans la fourchette 16–25) |
| Design visuel | Inchangé (A4, couleurs navy/rouge, photo) |
| Ton | Français professionnel, dynamique, orienté vente |
| Faits | Aucun chiffre inventé ; vente en ligne 2024–présent conservée |

## Hors scope

- Envoi de la candidature (WhatsApp / e-mail)
- Préparation entretien dédiée
- Modification `css/style.css` ou `css/print.css`
- Logo Langage Digital (non fourni — en-tête texte sur la lettre)
- Version CV serveuse parallèle (l’existant reste dans l’historique git / PDF Serveuse)

---

## Section CV — `index.html`

### Identité

| Champ | Avant | Après |
|-------|-------|-------|
| `<title>` | CV Serveuse | CV Closer WhatsApp |
| `cv-identity__role` | Serveuse & Hôtesse d'accueil | Closer WhatsApp — Vente digitale |

### Profil personnel (~4 lignes)

Angle : vendeuse digitale expérimentée, télétravail, closing WhatsApp.

Contenu à couvrir :
1. Expérience vente en ligne depuis 2024 (prospects → commande)
2. Maîtrise WhatsApp Business, Facebook, Canva
3. Français + lingala pour échanger avec la clientèle locale
4. Dynamisme, sérieux, télétravail et horaires flexibles

### Section « Langues & disponibilités » → « Langues & modalités »

- Français · Lingala · Kituba
- Télétravail — horaires flexibles
- Disponible immédiatement

### Section « Qualités professionnelles » → « Compétences clés »

Remplacer les 3 puces restauration par :
- WhatsApp Business · Facebook · Canva · Instagram · TikTok
- Accueil, conseil et accompagnement client jusqu'à la vente
- Dynamisme, persuasion et rigueur dans le suivi des prospects

### Expériences (ordre et reformulation)

**1. Vente en ligne — Accessoires & vêtements femme** (en premier)  
Meta : Activité indépendante · 2024 - Présent  
Puces orientées closing :
- Prospection et échanges avec les clientes sur WhatsApp Business, Facebook, Instagram et TikTok
- Réponse aux questions, présentation des offres et accompagnement jusqu'à la commande
- Création de visuels promotionnels avec Canva
- Fidélisation et suivi post-vente

**2. Co-organisation événementielle — Accueil & relation client**  
Meta : Événement familial · ~200 convives · 2026  
Puces allégées (soft skills transférables, pas restauration) :
- Accueil et orientation d'un large public
- Communication sous pression et travail en équipe
- Coordination et sens du service

**3. Stage — Accueil & communication (milieu hospitalier)**  
Meta : Hôpital central des armées Pierre-Mobengo · 2025  
2 puces : courtoisie, écoute, rigueur.

### Formation

Section **Éducation & Formation** inchangée (2 entrées compactes) :
- Formation en Soins Infirmiers — Kelasi Academy · 2023 - 2025
- Baccalauréat série D — École Évangélique Cité de Dolisie · 2019 - 2020

*(Formation santé = sérieux et rigueur, sans orienter vers les soins.)*

---

## Section Lettre — `lettre-motivation-langage-digital.html`

Basée sur la structure de `lettre-motivation-woya.html` (même CSS inline, charte navy/rouge).

### En-tête

**Expéditeur :** Mirfa Kouamala, Pointe-Noire, +242 06 694 11 98, mirfatsala@gmail.com  

**Destinataire :** (sans logo)  
```
Langage Digital
Croissance & Acquisition
Pointe-Noire, Congo-Brazzaville
```

### Objet

`Candidature au poste de Closer WhatsApp en télétravail — Chantier Vacances Digital 2026`

### Corps (~4 paragraphes + formule)

1. **Accroche** — Référence à l'offre Chantier Vacances Digital 2026 ; motivation pour la vente digitale et le télétravail.
2. **Expérience vente** — Vente en ligne depuis 2024 : WhatsApp Business, Facebook, Canva ; cycle prospect → questions → achat.
3. **Soft skills** — Français et lingala ; dynamisme ; événement familial (accueil large public) + stage hospitalier (écoute, rigueur).
4. **Disponibilité & motivation** — Télétravail, horaires flexibles, envie de progresser avec formation Langage Digital et modèle à la commission.
5. **Formule de politesse** standard.

**Date :** Pointe-Noire, le 26 juin 2026  
**Signature :** Mirfa Kouamala

---

## Fichiers & export PDF

| Fichier | Action |
|---------|--------|
| `cv-mirfa-kouamala/index.html` | Modifier contenu |
| `cv-mirfa-kouamala/lettre-motivation-langage-digital.html` | Créer |
| `scripts/generate-mirfa-cv-pdf.mjs` | Sortie par défaut → `Mirfa Kouamala - CV Closer WhatsApp.pdf` |
| `scripts/generate-mirfa-lettre-pdf.mjs` | Créer (même logique Playwright, cible lettre HTML) |
| `package.json` | Ajouter `export:pdf:mirfa-lettre` si absent |
| `README` ou commentaire script | Documenter les deux exports |

Commandes cibles :
```bash
bun run export:pdf:mirfa
bun run export:pdf:mirfa-lettre
```

---

## Critères de succès

- [x] CV une page A4 sans débordement (PDF)
- [x] Lettre une page A4 (PDF)
- [x] Mots-clés offre présents : WhatsApp Business, Canva, Facebook, lingala, télétravail, commissions
- [x] Aucune mention « serveuse » / « restauration » comme objectif principal
- [x] Coordonnées et photo inchangées
- [x] Orthographe française soignée
- [x] Dossier prêt à envoyer : 2 PDF + photo (déjà dans le CV)

## Livrables candidature (rappel offre)

À envoyer par le candidat :
- `Mirfa Kouamala - CV Closer WhatsApp.pdf`
- `Mirfa Kouamala - Lettre Langage Digital.pdf`
- Photo récente (`assets/photo.jpeg` — déjà intégrée au CV ; envoyer aussi en pièce jointe si demandé)
