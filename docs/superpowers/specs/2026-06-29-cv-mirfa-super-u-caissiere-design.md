# CV Mirfa Kouamala — Super U Caissières journalières — Design Spec

**Date:** 2026-06-29  
**Statut:** Approuvé — implémenté 2026-06-29  
**Offre:** Super U Congo — Caissières journalières (recrutement affiché en magasin)  
**Candidature:** Dépôt de CV avec photo à l'accueil + photocopie pièce d'identité

## Objectif

Adapter le dossier `cv-mirfa-kouamala/` pour candidater au poste de **caissière journalière** chez **Super U**, avec un **CV pivoté commerce alimentaire / caisse** prêt pour dépôt physique (PDF).

## Contraintes validées

| Contrainte | Décision |
|------------|----------|
| Périmètre | CV seul (pas de lettre de motivation) |
| Approche | Pivot complet du contenu (approche 1) |
| Disponibilité | Missions journalières ponctuelles, selon besoins du magasin |
| Expérience clé | Boutique d'alimentation familiale · 2017 - 2020 · ponctuelle |
| Tâches boutique | Caisse, approvisionnement, mise en rayon/stocks, hygiène, accueil client |
| Âge | 25 ans (critère « 20 ans et plus » respecté) |
| Design visuel | Inchangé (A4, couleurs navy/rouge, photo) |
| Ton | Français professionnel, chaleureux, orienté service client |
| Faits | Aucun chiffre inventé |

## Hors scope

- Lettre de motivation
- Dépôt de candidature à l'accueil Super U
- Préparation entretien
- Modification `css/style.css` ou `css/print.css`
- Logo Super U
- Version CV Langage Digital ou serveuse parallèle (l'existant reste dans l'historique git / PDF précédents)

---

## Section CV — `index.html`

### Identité

| Champ | Avant | Après |
|-------|-------|-------|
| `<title>` | CV Closer WhatsApp | CV Caissière |
| `cv-identity__role` | Closer WhatsApp — Vente digitale | Caissière — Commerce alimentaire |

### Profil personnel (~4 lignes)

Angle : caissière avec expérience alimentaire, contact client soigné, profil aligné sur l'annonce Super U.

Contenu à couvrir :
1. Expérience en boutique d'alimentation familiale (caisse, stocks, hygiène, accueil) — 2017–2020
2. À l'aise avec la clientèle : dynamique, souriante, polie et discrète
3. Base relation client renforcée par la vente en ligne et l'accueil événementiel
4. Disponible pour des missions journalières ponctuelles, selon les besoins du magasin

### Section « Langues & modalités » → « Langues & disponibilités »

- Français · Lingala · Kituba
- Missions journalières — disponibilité flexible selon les besoins
- Pointe-Noire

### Section « Compétences clés » → « Qualités professionnelles »

3 puces alignées sur le profil recherché Super U :
- Dynamique, souriante et très polie avec la clientèle
- Discrète, respectueuse et à l'aise en équipe
- Présentable, s'exprime clairement et veille à la satisfaction des clients

### Expériences (ordre et reformulation)

**1. Gestion de caisse — Boutique d'alimentation familiale** (en premier)  
Meta : Activité familiale · 2017 - 2020 · Expérience ponctuelle  
Puces :
- Gestion de caisse et encaissement des ventes
- Accueil et conseil client au comptoir
- Approvisionnement, mise en rayon et gestion des stocks
- Hygiène et propreté du point de vente

**2. Vente en ligne — Relation clientèle**  
Meta : Activité indépendante · 2024 - Présent  
Puces reformulées (sans angle digital/closing) :
- Accueil et échanges courtois avec la clientèle
- Prise de commandes et suivi jusqu'à la livraison
- Fidélisation et sens du service

**3. Co-organisation événementielle — Accueil & relation client**  
Meta : Événement familial · 2026  
Puces allégées :
- Accueil et orientation d'un large public
- Travail en équipe et communication sous pression

**4. Stage — Accueil & communication (milieu hospitalier)**  
Meta : Hôpital central des armées Pierre-Mobengo · 2025  
2 puces : courtoisie, écoute, discrétion.

**Ajustement mise en page :** si débordement A4 à l'export PDF, réduire l'événementiel à 2 puces courtes ; priorité absolue : boutique + vente en ligne.

### Formation

Section **Éducation & Formation** inchangée (2 entrées compactes) :
- Formation en Soins Infirmiers — Kelasi Academy · 2023 - 2025
- Baccalauréat série D — École Évangélique Cité de Dolisie · 2019 - 2020

---

## Fichiers & export PDF

| Fichier | Action |
|---------|--------|
| `cv-mirfa-kouamala/Mirfa Kouamala - CV Caissière.html` | Modifier contenu |
| `scripts/generate-mirfa-pdf.mjs` | Export HTML → PDF (même nom de base) |

Commande cible :
```bash
bun run export:pdf:mirfa
```

---

## Critères de succès

- [x] CV une page A4 sans débordement (PDF)
- [x] Mots-clés offre présents : caisse, accueil client, dynamique, discrétion, équipe, hygiène
- [x] Boutique alimentaire 2017–2020 en première expérience
- [x] Aucune mention « closer WhatsApp » / « télétravail » / « restauration » comme objectif principal
- [x] Coordonnées et photo inchangées
- [x] Orthographe française soignée
- [x] Prêt pour dépôt physique : PDF + photo (déjà intégrée au CV)

## Livrables candidature (rappel offre)

À déposer par le candidat à l'accueil Super U :
- `Mirfa Kouamala - CV Caissière.pdf`
- Photocopie pièce d'identité (hors périmètre technique)
