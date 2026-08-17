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

> **Note :** le champ `overrides` de `package.json` épingle Express 4.21.2 pour assurer la compatibilité de json-server-auth 2.1.0 avec les résolutions npm récentes (détail dans le rapport, section 7.1). Aucune action requise : `npm install` applique ce correctif automatiquement.

## Comptes de test

| Email           | Mot de passe | Rôle         |
|-----------------|--------------|--------------|
| client@gp.sn    | passer123    | client       |
| gpexpress@gp.sn | passer123    | transporteur |

## Stack technique

- **Frontend :** Angular 20+ (composants standalone, Signals, Reactive Forms, HttpClient, guards fonctionnels, OnPush)
- **Backend mock :** JSON Server 0.17.4 + json-server-auth 2.1.0 (authentification JWT)
- **Données :** `db.json` (versionné) · permissions serveur dans `routes.json`

## Structure du projet

```
src/app/
├── app.paths.ts           # CONTRAT DE ROUTES (voir docs/contrat-de-routes.pdf)
├── core/                  # transverse : auth, sécurité, erreurs
│   ├── services/          #   auth (JWT, signaux de session), trajets
│   ├── interceptors/      #   auth-interceptor (Bearer), error-interceptor
│   └── guards/            #   auth-guard (returnUrl), role-guard (data.role)
├── features/              # fonctionnalités métier (chaque périmètre crée les siennes)
│   ├── auth/              #   login, register
│   ├── trajets/           #   liste-trajets, detail-trajet
│   └── commandes/         #   formulaire-commande
├── shared/                # composants réutilisables
│   └── components/        #   topbar (+ badge, timeline... au fil de B6)
└── models/                # interfaces TypeScript (contrat commun)
```

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
- **Workflow** : `feature/xx-nom` créée depuis `dev` → commits fréquents (`feat(a3): ...`) → PR vers `dev` → relecture par l'autre membre → merge → suppression de la branche. PR non relue sous 24h : l'auteur peut merger.
- **Contrat de routes** : toute navigation passe par les constantes de `src/app/app.paths.ts` (référence : `docs/contrat-de-routes.pdf`). Fichiers partagés (`models/`, `app.routes.ts`, `db.json`, `app.paths.ts`) : concertation avant modification.
- **Répartition** : Djimouna (A) : authentification, guards, recherche/fiche trajet, commande, erreurs · Said (B) : layout, annuaire, rendez-vous, suivi, espaces client et transporteur.

## Conception (Phase 1)

- **Maquette Figma :** https://www.figma.com/design/dPpUbLN5zymPISLpPqgVau/Wireframes-Phase-1
- **Prototype interactif :**https://www.figma.com/proto/dPpUbLN5zymPISLpPqgVau/Wireframes-Phase-1?node-id=1-348&starting-point-node-id=1%3A348
- Documentation projet : `docs/` (contrat de routes, plans de travail, rapport en cours)

## Déploiement

À venir (Phase 3) : lien du site déployé.