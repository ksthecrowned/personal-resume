# CV Mirfa Super U Caissière — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot `cv-mirfa-kouamala/index.html` pour l'offre Super U caissières journalières et exporter `Mirfa Kouamala - CV Caissière.pdf`.

**Architecture:** Modifier uniquement le contenu HTML (identité, profil, sections latérales, ordre expériences) sans toucher au CSS. Mettre à jour le nom de sortie PDF dans le script Playwright existant.

**Tech Stack:** HTML/CSS statique, Playwright (`bun run export:pdf:mirfa`)

## Global Constraints

- CV seul, pas de lettre
- Design visuel inchangé (pas de modification CSS)
- Boutique alimentaire 2017–2020 en première expérience, marquée ponctuelle
- Disponibilité : missions journalières ponctuelles
- Aucun chiffre inventé ; retirer mentions closer WhatsApp / télétravail / restauration
- Photo et coordonnées inchangées
- PDF une page A4 sans débordement

---

### Task 1: Pivot contenu CV

**Files:**
- Modify: `cv-mirfa-kouamala/index.html`

- [ ] **Step 1:** Mettre à jour `<title>`, `cv-identity__role`, profil personnel
- [ ] **Step 2:** Renommer « Langues & modalités » → « Langues & disponibilités » avec nouvelles puces
- [ ] **Step 3:** Remplacer « Compétences clés » par « Qualités professionnelles » (3 puces Super U)
- [ ] **Step 4:** Ajouter expérience boutique en tête ; reformuler vente en ligne ; alléger événementiel et stage

### Task 2: Export PDF

**Files:**
- Modify: `scripts/generate-mirfa-cv-pdf.mjs`

- [ ] **Step 1:** Changer sortie par défaut → `Mirfa Kouamala - CV Caissière.pdf`
- [ ] **Step 2:** Exécuter `bun run export:pdf:mirfa` et vérifier une page A4
