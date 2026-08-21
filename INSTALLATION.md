# Page Revenus + navigation retour au tableau de bord

PREREQUIS : lot ca-devise-reference installe, et auth.ts corrige
(celui qui contient mettreAJourSession ET deviseReference).

## Contenu

0. LA CARTE "CHIFFRE D'AFFAIRES" N'AFFICHE QU'UN SEUL MONTANT
   Le detail par devise a ete RETIRE de la carte du tableau de bord :
   elle affiche uniquement le total dans la devise de reference, avec
   la mention "Voir le detail par devise" quand plusieurs devises sont
   en jeu. Le detail complet est sur la page Revenus, au clic.

1. LA CARTE "CHIFFRE D'AFFAIRES" DEVIENT CLIQUABLE
   Elle mene a une NOUVELLE page /espace-transporteur/revenus qui detaille :
   - le total dans la devise de reference, le nombre de commandes,
     le montant moyen par commande
   - un tableau PAR DEVISE DE FACTURATION : montant reellement facture
     a gauche, equivalent en devise de reference a droite, et la part
     de chaque devise en pourcentage
   - l'evolution mensuelle (6 derniers mois) en devise de reference
   - le revenu PAR TRAJET, du plus rentable au moins rentable

   Toutes les devises presentes apparaissent : si vous facturez un jour
   en yens, la ligne "JPY" s'ajoute d'elle-meme au tableau et au detail
   de la carte du tableau de bord. Rien n'est code en dur.

2. RETOUR AU TABLEAU DE BORD
   Un lien "‹ Retour au tableau de bord" en haut de chaque sous-page :
   Mes trajets, Commandes recues, Revenus, Produits refuses,
   Avis et reclamations.
   (RouterLink a ete ajoute aux composants qui ne l'importaient pas
   encore, sans quoi le build echouerait.)

3. "MES COMMANDES" (transporteur) MONTRE LE TRAJET CONCERNE
   Une colonne "Trajet" est ajoutee au tableau des commandes recues :
   destination et date de depart, juste apres le numero de commande.
   Les trajets etaient deja charges par l'ecran, il suffisait de garder
   la correspondance : aucune requete supplementaire.

## Fichiers
- espace-transporteur/revenus/ : NOUVEAU (ts + html + css)
- espace-transporteur/espace-transporteur.routes.ts : + route revenus
- espace-transporteur/dashboard/ : html (carte CA cliquable)
- mes-trajets, commandes-recues, produits-illicites, avis-reclamations :
  ts + html + css (lien retour)

## Installation
Dezipper a la racine, ng serve. Aucun changement de db.json.

## Tests
1. Tableau de bord : les QUATRE cartes ont un chevron au survol.
   Cliquer sur "Chiffre d'affaires" -> page Revenus.
2. Tableau de bord : la carte Chiffre d'affaires affiche UN SEUL montant
   (184 319 FCFA avec les donnees de demo) et la mention
   "Voir le detail par devise". Aucune liste de devises sur la carte.
3. Page Revenus (donnees de demo) : total 184 319 FCFA,
   tableau par devise avec deux lignes (XOF majoritaire, EUR),
   equivalents et parts en pourcentage, revenu par trajet.
4. Depuis n'importe quelle sous-page, le lien du haut ramene au
   tableau de bord.
5. Changer la devise de lecture dans Mon profil (par exemple EUR) :
   la page Revenus recalcule le total et les equivalents, mais la
   colonne "Montant facture" ne bouge pas.
