# Évolution fret : fichiers finaux

Réfèrence : `docs/plan-evolution-fret.md` (7 décisions figées).
Couvre : E1 (modèles + db.json migré), E2 (inscription typée), E3 (formulaire trajet),
E4 (recherche filtrée par colis), E5 (commande au poids volumétrique),
E7 (complet automatique, intégré à E5/E3), E8 (RDV confirmé -> MAJ immédiate).
Reste à faire ensuite : E6 (écran produits illicites), E9 (accueil enrichi).

## Installation (dans l'ordre)

1. **Remplacer les fichiers** par ceux de ce dossier (mêmes chemins) :
   - `db.json` (racine du projet) : données MIGRÉES au nouveau modèle
   - `src/app/models/` : produits.ts (NOUVEAU), compatibilite.ts (NOUVEAU),
     transporteur.model.ts, trajet.model.ts, commande.model.ts
   - `src/app/core/services/` : auth.ts, trajets.ts, commandes.ts
   - `src/app/features/auth/register/` : ts + html + css
   - `src/app/features/trajets/liste-trajets/` : ts + html + css
   - `src/app/features/commandes/formulaire-commande/` : ts + html + css
   - `src/app/features/espace-transporteur/formulaire-trajet/` : ts + html + css
   - `src/app/features/espace-transporteur/commandes-recues/` : ts + html
     (le css existant est conservé)

2. **Redémarrer l'API** : Ctrl+C puis `npm run api` (db.json a changé).

3. `ng serve` : le build DOIT passer. Si erreur, elle viendra probablement
   d'un composant NON migré qui référence encore `prix` ou `placesDisponibles`
   (voir "Composants à ajuster" ci-dessous).

## Composants à ajuster (références à l'ancien modèle)

Ces écrans de la partie B lisent peut-être encore `t.prix` ou `t.placesDisponibles` :
- `detail-trajet` : afficher `prixParKilo`, capacité restante, type/modes du transporteur
- `dashboard` (espace transporteur) : stat "trajets actifs" inchangée ; retirer toute référence aux places
- `mes-trajets` : colonnes Prix -> Prix/kg, Places -> Capacité (kilosReserves/capaciteKilosTotale)
- `accueil` : si la recherche rapide passe `prixMax`, la renommer `prixKiloMax`

Rechercher dans le projet : `placesDisponibles` et `.prix` pour trouver les retardataires :
  grep -rn "placesDisponibles\|\.prix\b" src/app/

## Tests de validation

1. **Inscription transporteur** : /register -> Transporteur -> type INFORMEL puis PRO
   (modes visibles seulement en PRO). Vérifier db.json : type, modesTransport, produitsIllicites.
2. **Création de trajet** : espace transporteur -> Nouveau trajet : prix/kg, capacité,
   plage de réception (fin < départ sinon erreur).
3. **Recherche filtrée** : /trajets -> "Décrire mon colis" -> fragile + catégorie
   -> seuls les trajets PRO compatibles restent.
4. **Commande** : choisir un trajet -> saisir poids 2 kg et dimensions 60x50x50
   -> poids volumétrique 30 kg -> poids facturé 30 kg -> prix = 30 x prixParKilo.
   Vérifier après validation : kilosReserves du trajet a augmenté de 30.
5. **Complet automatique** : commander jusqu'à dépasser la capacité -> badge complet,
   trajet refusé à la commande suivante.
6. **E8** : côté transporteur, confirmer un RDV -> le lien "MAJ livraison"
   apparaît immédiatement sur la ligne.
