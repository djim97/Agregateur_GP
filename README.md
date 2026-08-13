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

- **Frontend :** Angular 20+ (composants standalone, Signals, Reactive Forms, HttpClient, guards)
- **Backend mock :** JSON Server 0.17.4 + json-server-auth 2.1.0 (authentification JWT)
- **Données :** `db.json` (versionné) · permissions serveur dans `routes.json`

## Structure du projet

```
src/app/
├── core/                  # transverse : auth, sécurité, erreurs
│   ├── services/          #   auth.ts (service d'authentification)
│   ├── interceptors/      #   auth-interceptor, error-interceptor
│   └── guards/            #   auth-guard, role-guard
├── features/              # fonctionnalités métier
│   ├── auth/              #   login, register
│   ├── trajets/           #   liste-trajets, detail-trajet
│   └── commandes/         #   formulaire-commande
├── shared/                # composants réutilisables
│   └── components/        #   topbar
└── models/                # interfaces TypeScript (contrat commun)
```

## API - endpoints principaux

| Besoin                      | Requête                                    |
|-----------------------------|--------------------------------------------|
| Trajets vers une destination| `GET /trajets?destination=Thiès`           |
| Trajet avec son transporteur| `GET /trajets/1?_expand=transporteur`      |
| Commandes d'un client       | `GET /commandes?clientId=1`                |
| Créer une commande          | `POST /commandes`                          |
| Suivi d'une livraison       | `GET /livraisons?commandeId=1`             |
| Inscription / connexion     | `POST /register` · `POST /login`           |

L'API applique une latence artificielle de 400 ms (`--delay 400`) pour tester les états de chargement.

## Conception (Phase 1)

- **Maquette Figma :** https://www.figma.com/design/dPpUbLN5zymPISLpPqgVau/Wireframes-Phase-1
- **Prototype interactif :** https://www.figma.com/proto/dPpUbLN5zymPISLpPqgVau/Wireframes-Phase-1

## Organisation du travail

- Branche `main` : versions stables · branche `dev` : intégration · branches `feature/*` : développement
- Djimouna (A) : authentification, guards, recherche de trajets, fiche trajet, création de commande, gestion des erreurs
- Said (B) : rendez-vous, suivi de livraison, espace client, espace transporteur, annuaire, layout

## Déploiement

À venir (Phase 3) : lien du site déployé.