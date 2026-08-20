# Agrégateur de Transporteurs GP

Plateforme web de mise en relation entre clients et transporteurs « GP » : recherche de trajets par destination, création de commandes, prise de rendez-vous et suivi des livraisons.

Projet Angular 20+ / JSON Server · Groupe ISI · DITI 3

**Membres du groupe**
- Djimouna Bacary BADJI
- Said FOUADI

---

## Lancement

Prérequis : Node.js et Angular CLI installés.

Ouvrir deux terminaux à la racine du projet :

```bash
npm install
npm run api        # Terminal 1 - API mock sur http://localhost:3000
ng serve           # Terminal 2 - Application sur http://localhost:4200
```

> **Note :** le champ `overrides` de `package.json` épingle Express 4.21.2 pour assurer la compatibilité de json-server-auth 2.1.0 avec les résolutions npm récentes. L'API est lancée via le CLI json-server-auth afin que les permissions de `routes.json` soient réellement appliquées (détails dans le rapport, section 7). Aucune action requise : `npm install` puis `npm run api` suffisent.

## Comptes de test

| Email           | Mot de passe | Rôle         |
|-----------------|--------------|--------------|
| client@gp.sn    | passer123    | client       |
| gpexpress@gp.sn | passer123    | transporteur |

## Fonctionnalités

**Côté client**
- Recherche de trajets par destination, avec filtres de prix, tri et pagination
- Consultation d'une fiche trajet et des informations du transporteur
- Création de commande avec décrément automatique des places disponibles
- Prise de rendez-vous pour le dépôt du colis
- Espace personnel : suivi des commandes et des rendez-vous
- Suivi de livraison en temps réel (timeline des statuts)
- Annuaire des transporteurs avec recherche et filtre par zone

**Côté transporteur**
- Tableau de bord (trajets actifs, commandes reçues, rendez-vous à confirmer)
- Publication et gestion de ses trajets (création, modification, suppression)
- Traitement des commandes reçues et confirmation des rendez-vous
- Mise à jour des livraisons (statut, position, date estimée)

## Stack technique

- **Frontend :** Angular 20+ (composants standalone, Signals, Reactive Forms, HttpClient, guards fonctionnels, lazy loading par périmètre, OnPush)
- **Backend mock :** JSON Server 0.17.4 + json-server-auth 2.1.0 (authentification JWT)
- **Données :** `db.json` (versionné) · permissions serveur dans `routes.json`

## Structure du projet

```
src/app/
├── app.paths.ts           # CONTRAT DE ROUTES (voir docs/contrat-de-routes.pdf)
├── core/
│   ├── services/          # auth, trajets, commandes, notifications,
│   │                      # transporteurs, livraisons, rendezvous, trajets-transporteur
│   ├── interceptors/      # auth-interceptor (Bearer), error-interceptor
│   └── guards/            # auth-guard (returnUrl), role-guard (data.role)
├── features/
│   ├── auth/              # login, register
│   ├── trajets/           # liste-trajets, detail-trajet
│   ├── commandes/         # formulaire-commande
│   ├── transporteurs/     # annuaire
│   ├── suivi/             # suivi-livraison
│   ├── espace-client/     # mes-commandes
│   ├── rendezvous/        # nouveau-rdv
│   └── espace-transporteur/  # dashboard, mes-trajets, formulaire-trajet,
│                          #   commandes-recues, maj-livraison
├── shared/
│   └── components/        # topbar, toasts, badge-statut, etape-timeline,
│                          #   spinner, etat-vide
└── models/                # interfaces TypeScript (contrat commun)
```

Chaque périmètre expose ses routes via un fichier `*.routes.ts` chargé en lazy loading depuis `app.routes.ts`.

## API - endpoints principaux

| Besoin                       | Requête                                   |
|------------------------------|-------------------------------------------|
| Trajets vers une destination | `GET /trajets?destination=Thiès`          |
| Filtres, tri, pagination     | `GET /trajets?prix_lte=3000&_sort=prix&_page=1&_limit=10` |
| Trajet avec son transporteur | `GET /trajets/1?_expand=transporteur`     |
| Commandes d'un client        | `GET /commandes?clientId=1`               |
| Créer une commande           | `POST /commandes`                         |
| Suivi d'une livraison        | `GET /livraisons?commandeId=1`            |
| Inscription / connexion      | `POST /register` · `POST /login`          |

L'API applique une latence artificielle de 400 ms (`--delay 400`) pour tester les états de chargement. Les routes d'authentification ne sont pas soumises à cette latence.

## Organisation du travail

- **`main` est protégée** : aucune fusion sans Pull Request. Elle ne reçoit que des merges de `dev` aux jalons stables.
- **`dev`** (branche par défaut) : branche d'intégration. Le code y arrive uniquement par PR depuis des branches `feature/*`.
- **Workflow** : `feature/xx-nom` créée depuis `dev` → commits fréquents → PR vers `dev` → relecture par l'autre membre → merge → suppression de la branche.
- **Contrat de routes** : toute navigation passe par les constantes de `src/app/app.paths.ts` (référence : `docs/contrat-de-routes.pdf`).
- **Répartition** : Djimouna (A) : authentification, guards, recherche/fiche trajet, commande, gestion des erreurs · Said (B) : rendez-vous, suivi, espaces client et transporteur, annuaire, layout et composants partagés. Détail dans `docs/repartition-taches.pdf`.

## Documentation (dossier `docs/`)

- Contrat de routes · Plans de travail (A et B) · Répartition des tâches
- Rapport technique · Guide utilisateur

## Conception (Phase 1)

- **Maquette Figma :** https://www.figma.com/design/dPpUbLN5zymPISLpPqgVau/Wireframes-Phase-1
- **Prototype interactif :** https://www.figma.com/proto/dPpUbLN5zymPISLpPqgVau/Wireframes-Phase-1

## Déploiement

À venir (Phase 3) : lien du site déployé.