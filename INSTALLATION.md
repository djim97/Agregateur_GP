# Avis visibles + Réclamations traitables

PRÉREQUIS : les lots précédents installés (e6-e9, lot-complet, profil-reclamations),
et la ressource "reclamations" créée (node add-reclamations.js).

## Ce que ça règle

Avant : un client pouvait laisser un avis et ouvrir une réclamation,
mais PERSONNE ne les voyait jamais. Les deux features étaient à moitié construites.

Maintenant :
- les avis remontent au transporteur et s'affichent sur son profil public,
  avec la note recalculée depuis les vrais avis (au lieu du chiffre figé) ;
- les réclamations liées à une commande sont ROUTÉES vers le transporteur
  concerné, qui les prend en charge et y répond (traitement de niveau 1,
  le modèle des marketplaces : le prestataire répond avant toute escalade).

## Fichiers

- shared/components/topbar/topbar.html : "Mes commandes" pointe vers les
  commandes reçues pour un transporteur ; liens client inchangés
- models/avis.model.ts : + transporteurId, + moyenneAvis()
- models/reclamation.model.ts : + transporteurId, + dateReponse
- core/services/avis.ts : + getByTransporteur() ; creer() résout le
  transporteur (commande -> trajet) et le stocke sur l'avis
- core/services/reclamations.ts : + getByTransporteur(), prendreEnCharge(),
  repondre() ; creer() route la réclamation vers le transporteur
- features/espace-client/mes-commandes/mes-commandes.ts : signature d'avis alignée
- features/espace-transporteur/avis-reclamations/ : NOUVEAU (ts + html + css)
  deux onglets : avis reçus (avec note moyenne et étoiles) et réclamations
  (prendre en charge -> répondre et clôturer)
- features/espace-transporteur/espace-transporteur.routes.ts : + route
- features/espace-transporteur/dashboard/dashboard.html : + lien (garde les graphes)
- features/transporteurs/profil-transporteur/ : ts + html + css
  (section "Avis clients" + note recalculée)

## Installation

1. Dézipper à la racine du projet.
2. ng serve (aucun changement de db.json : rien à redémarrer côté API,
   SAUF si vous n'aviez pas encore lancé add-reclamations.js).

## Tests

1. Client : "Mes commandes" -> onglet Livrées -> laisser un avis 4 étoiles
   avec commentaire.
2. Transporteur du trajet concerné : Espace transporteur -> "Avis et
   réclamations" -> onglet Avis : l'avis apparaît, la note moyenne se calcule.
3. Profil public du transporteur (/transporteurs/:id, même déconnecté) :
   section "Avis clients" en bas, note de l'en-tête recalculée.
4. Client : "Réclamations" -> nouvelle réclamation EN CHOISISSANT une commande.
5. Transporteur : onglet Réclamations -> le dossier apparaît avec un compteur
   orange -> "Prendre en charge" (statut En traitement) -> "Répondre et
   clôturer" avec un texte -> statut Résolue.
6. Client : sa page Réclamations montre la frise complétée et la réponse.

## Limite assumée

Une réclamation GÉNÉRALE (sans commande sélectionnée) n'a pas de destinataire :
elle reste "Ouverte" et n'apparaît chez aucun transporteur. Le traitement
de ces dossiers suppose un rôle administrateur, qui n'existe pas encore
(voir NOTES-EVOLUTIONS.md, point 3).
