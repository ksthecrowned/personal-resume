# Exemples — CV Variant Builder

## Déclencheurs utilisateur

```
Adapte mon CV pour cette offre : [coller JD]
```

```
Crée une variante backend NestJS focalisée fintech
```

```
Génère une version Lead Tech à partir de ma variante default
```

## Exemple — mission réécrite

**Avant (default) :**
```
Développement de fonctionnalités mobiles avec Flutter & React-Native.
```

**Après (variante mobile-lead) :**
```
Delivery mobile cross-platform : conception et livraison de features temps réel (Flutter, React Native) sur une plateforme de livraison multi-acteurs ; coordination avec produit et backend.
```

## Exemple — profil adapté

**Default (Full-Stack généraliste) :**
> Software Engineer orienté systèmes et production, avec plus de 5 ans d'expérience…

**Variante backend-nestjs :**
> Ingénieur backend orienté systèmes transactionnels, 5+ ans sur APIs NestJS/Node.js, bases PostgreSQL et architectures temps réel (Socket.IO). Expérience fintech et e-commerce à forte contrainte de disponibilité ; intervention directe en production (incidents, déploiement, supervision).

## Exemple — skills réordonnés

Pour une JD backend, mettre en premier le bloc « Backend & services critiques », y injecter les mots-clés JD (ex. « Event-driven », « REST », « PostgreSQL »), et réduire le bloc mobile si le poste est 100 % backend.

## Exemple — livraison agent

```
Variante créée : data/variants/backend-nestjs-fintech.json

Preview : http://localhost:3000/?variant=backend-nestjs-fintech

Changements :
- Titre cible → Développeur Backend Senior
- LRC GROUP : missions recentrées API/transactions, stack NestJS en tête
- Compétences : bloc Backend élargi (microservices, PostgreSQL, temps réel)
- 2 métriques manquantes : volume transactions/jour, taille équipe

Conseils carrière :
1. Préparer un cas concret de stabilisation flux transactionnels (avant/après)
2. La JD mentionne Kafka — si pas d'expérience, positionner Redis/Socket.IO comme proche
3. Question probable : comment garantir l'idempotence des paiements
```
