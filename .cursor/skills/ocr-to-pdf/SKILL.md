---
name: ocr-to-pdf
description: Convertit une image ou un scan en PDF recherchable via Tesseract OCR local. Utiliser quand l'utilisateur demande OCR d'une photo, conversion scan→PDF texte, ou PDF recherchable depuis JPG/PNG.
---

# OCR → PDF recherchable

Pipeline **image/scan → PDF recherchable** (image conservée + couche texte invisible).

## Prérequis

Tesseract OCR installé et dans le PATH :

```bash
tesseract --version
```

Windows : [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)

Langues : `eng` (défaut), `fra` optionnel.

## Commande

```bash
bun run ocr:pdf -- "<chemin-image>" [--lang eng] [--preprocess] [--out <pdf>]
```

Sortie par défaut : `exports/ocr/<nom>.pdf`

## Workflow agent

1. Vérifier Tesseract : `tesseract --version`
2. Confirmer le chemin source avec l'utilisateur si ambigu
3. Choisir `--lang` selon la langue du document (`eng` pour certificats anglais)
4. Lancer la commande ; ajouter `--preprocess` si l'image est petite ou peu contrastée
5. Communiquer le chemin absolu du PDF produit
6. Demander test Ctrl+F sur mots-clés attendus du document
7. Si OCR faible → relancer avec `--preprocess`

## Limitations

- Texte en police script/cursive souvent mal reconnu
- Pas de fallback cloud en v1
- Qualité dépend de la résolution et du contraste du scan

## Erreurs courantes

| Message | Action |
|---------|--------|
| Tesseract introuvable | Guider install Windows + PATH |
| Langue non installée | `--lang eng` ou réinstaller pack langue |
| Extension non supportée | JPG, PNG, TIFF, WebP uniquement |
