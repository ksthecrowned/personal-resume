# JobForge — Design Spec (MVP candidature + vision orientation)

**Date:** 2026-07-26  
**Statut:** Approuvé en brainstorming (sections 1–4)  
**Nom:** JobForge (provisoire — vision long terme = plateforme d’orientation Bac → carrière)

## 1. Contexte & vision

### Vision long terme
Plateforme d’**orientation des jeunes** de l’obtention du Bac jusqu’à la fin de carrière : s’orienter → se former → candidater → évoluer. JobForge est le **premier module produit** (candidature / employabilité), pas la destination de marque définitive.

### MVP (ce build)
SaaS **B2C** pour un profil candidat “lambda” au **Congo-Brazzaville** (focus), avec **CEMAC en lecture**. B2B (cabinets, écoles) **hors MVP**, prévu ensuite.

Inspiré du repo `personal-resume` (variantes CV, lettres, match offres, envois, vérif email, annuaire spontanées) — **concepts réutilisés**, pas le HTML Figma collé tel quel en multi-tenant.

## 2. Utilisateur & job #1

| | |
|--|--|
| **Persona MVP** | Candidat individuel (ex. Styve, Mirfa, jeune diplômé) |
| **Entrée produit** | Coller une **offre** → match → lettre → PDF → **envoi** |
| **Jobs secondaires** | Atelier CV/variantes, annuaire entreprises + vérif email, candidatures spontanées |

## 3. Stack technique

| Couche | Choix |
|--------|--------|
| App | **Next.js** (App Router) sur **Vercel** |
| DB | **PostgreSQL** distant (**AlwaysData**) |
| Fichiers | **Cloudflare R2** (CV upload, logos, PDF) |
| IA | **Cloudflare Workers AI** |
| Email candidature | **OAuth** Gmail / Microsoft — envoi depuis la boîte du **candidat** |
| PDF | HTML template → rendu (Playwright / Chromium compatible Vercel, ou job async si timeout) |

### Hors stack MVP
- SQLite fichier local, Turso  
- SMTP plateforme comme canal principal  
- 100 % Cloudflare Workers (Pages/D1) comme runtime app  

## 4. Architecture

```
Next.js (Vercel) ──► PostgreSQL (AlwaysData)
       │
       ├──► Cloudflare Workers AI (extract, parse JD, match, lettre)
       ├──► R2 (documents, PDF, logos)
       └──► OAuth Gmail / Outlook → envoi + PJ
```

### Modules MVP
1. Auth (compte + liaison OAuth mail)  
2. Profil (upload → extract IA → édition)  
3. Variantes CV  
4. Candidature (offre → match → lettre → PDF → envoi)  
5. Annuaire entreprises (seed Congo, CEMAC lecture) + vérif email  
6. Atelier templates + export PDF  

### Hors MVP
B2B multi-candidats, white-label, scraping ACPE live, app mobile, marketplace de templates, garantie anti-bounce.

## 5. Templates CV & lettres

**Séparation contenu / présentation :**

| Couche | Rôle |
|--------|------|
| Profil / variante | JSON structuré (expériences, skills, angle) |
| Template | Thème HTML/CSS versionné |
| PDF | Rendu A4 depuis HTML |

**MVP templates :** 2 thèmes CV + 1 thème lettre.  
IA rédige le **contenu** ; l’utilisateur valide ; pas d’invention d’employeurs/dates.

## 6. Modèle de données (Postgres)

| Table | Rôle |
|-------|------|
| `users` | Compte, locale `fr`, pays focus `CG` |
| `profiles` | Profil structuré |
| `profile_documents` | Uploads R2, statut extraction |
| `variants` | Angles CV (slug, overrides JSON) |
| `templates` | Thèmes CV/lettre |
| `companies` | Annuaire, emails RH, pays, logo |
| `email_checks` | MX/SMTP, verdict, horodatage |
| `applications` | Offre, score, variante, statut |
| `application_assets` | Lettre HTML, PDF R2 |
| `oauth_accounts` | Tokens chiffrés |
| `send_logs` | Message-id, erreurs, bounces |

## 7. Flux principaux

### 7.1 Offre → envoi (écran d’entrée)
1. Coller offre (texte ; URL/OCR plus tard)  
2. AI `parse_job`  
3. AI `match` + suggestion de variante  
4. Validation user  
5. AI `draft_letter` + template  
6. Preview → PDF → R2  
7. Envoi OAuth + PJ  
8. Statut `sent` / suivi manuel si pas de tracking  

### 7.2 Onboarding profil
Upload CV → R2 → extract texte → AI `extract_cv` → formulaire correction → variante `default`.

### 7.3 Spontané
Annuaire → vérif email → lettre → même pipeline PDF/envoi.

## 8. IA Cloudflare (jobs)

| Job | Sortie |
|-----|--------|
| `extract_cv` | Profil JSON |
| `parse_job` | JD structurée |
| `match` | Score 0–100, gaps, variante suggérée |
| `draft_letter` | Corps lettre FR |
| `improve_bullet` | Reformulation (atelier) |

**Règles :** prompts versionnés ; faits non inventés ; validation humaine avant PDF/envoi.

## 9. Erreurs, limites, sécurité

- Extraction faible → correction obligatoire avant envoi  
- Score bas → warning, override possible  
- OAuth expiré → reconnect  
- `no_mx` / user unknown → blocage soft + override  
- Rate limits IA & envois / jour  
- PDF timeout → retry / async  
- Tokens OAuth chiffrés ; R2 privé (URLs signées)  
- Export / suppression compte  
- Pas de revente d’emails annuaire  

**Note vérif email :** beaucoup de `550` sont des blocages IP (Spamhaus), pas des boîtes mortes — distinguer `blocked_ip` vs `likely_missing` (comme dans `verify-emails.mjs` du monorepo actuel).

## 10. UI (FR)

1. Accueil — CTA “Colle une offre”  
2. Onboarding profil  
3. Match  
4. Lettre + preview  
5. Envoi OAuth  
6. Suivi candidatures  
7. Annuaire  
8. Atelier CV / variantes / PDF  

## 11. Monétisation (V1 légère)

| Plan | Contenu indicatif |
|------|-------------------|
| Free | 1 profil, quota matchs/mois, filigrane PDF optionnel |
| Pro | Variantes + envois + annuaire, sans filigrane |

Détail pricing hors scope de cette spec technique.

## 12. Critères de succès MVP

1. Profil depuis un CV en **&lt; 10 minutes**  
2. **1 candidature complète** (match + lettre + PDF + mail) le jour 1  
3. Annuaire Congo seed **≥ 50** entreprises avec emails RH  
4. **0 invention de faits** non validés dans les lettres  

## 13. Roadmap produit (hors implémentation MVP)

1. **JobForge MVP** — candidater (ce document)  
2. **B2B** — cabinets / écoles, multi-profils  
3. **Orientation** — Bac → formations → métiers → carrière (rebrand possible)  

## 14. Décisions figées

- Approche : Next + Postgres AlwaysData + CF AI + Vercel + R2 (pas Cloudflare-native app)  
- Templates : HTML + JSON + PDF  
- Mail : OAuth candidat uniquement au MVP  
- Géo : Congo focus, CEMAC lecture  
- Nom : JobForge pour le moment  

## 15. Références repo actuel

- Variantes : `data/variants/*.json`  
- Spontanées : `data/spontanees.json`, `scripts/generate-spontanees.mjs`, `scripts/send-spontanees.mjs`  
- Vérif email : `scripts/verify-emails.mjs`, `lettres/verifier-emails.html`  
