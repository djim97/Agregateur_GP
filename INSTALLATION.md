# Lot complet : horodatage, avis bidirectionnels, navigation transporteur

CE ZIP REMPLACE avis-bidirectionnels.zip : il en contient tout le
contenu, plus l horodatage des etapes. Inutile d installer l autre.

PREREQUIS : lots revenus-navigation et avis-bidirectionnels installes.

## Ce que ca change

Les etapes affichaient un statut sans dire QUAND il avait ete atteint.
Chaque etape porte desormais sa date, et son heure quand elle est connue.

### Suivi de livraison (cote client)
- Commande confirmee : date de la commande
- Colis depose : date et heure du rendez-vous
- En cours de transport : "Depuis le ... · Position : ..."
- Livre : date et heure reelles, ou date estimee tant que ce n'est pas fait
- NOUVEAU : un "Journal des mises a jour" liste toutes les modifications
  du transporteur, la plus recente en premier, avec date, heure, statut
  et position.

### Reclamations (cote client et cote transporteur)
- Reclamation recue : date et heure de creation
- Prise en charge : date et heure, ou "en attente" tant que le
  transporteur n'a rien fait
- Resolue : date et heure de la reponse

## Navigation retour dans l espace transporteur

Le lien "‹ Retour au tableau de bord" est present en haut de TOUTES les
sous-pages : Mes trajets, Commandes recues, Revenus, Produits refuses,
Avis et reclamations. L ecran de mise a jour d une livraison garde son
bouton Retour, qui ramene aux commandes recues.

Ces fichiers etaient livres dans les zips precedents (revenus-navigation
et avis-bidirectionnels) ; ils sont REPRIS ICI pour que tout soit au
meme endroit. Les versions incluses sont les plus recentes : colonne
Trajet, colonne Client avec sa reputation, notation du client, prix
dans la devise du trajet.

## Navigation retour cote client

Deux pages etaient des culs-de-sac : le SUIVI d une livraison et la PRISE
DE RENDEZ-VOUS. On y arrive depuis Mes commandes sans pouvoir y revenir
autrement que par le bouton du navigateur. Un lien
"‹ Retour a mes commandes" est ajoute en haut des deux.

## Correction : bouton "Prendre RDV" sur des commandes livrees

La condition d affichage ne regardait que l absence de rendez-vous, sans
tenir compte du statut. Une commande LIVREE sans rendez-vous enregistre
proposait donc encore de prendre rendez-vous pour deposer le colis.
Le bouton n apparait desormais que sur les commandes EN_ATTENTE.
La date du rendez-vous est aussi affichee avec son heure.

## Le rendez-vous s inscrit dans la plage de reception

Incoherence corrigee : le rendez-vous existait AVANT la refonte fret, la
plage de reception est arrivee APRES, et rien ne les reliait. Un client
pouvait fixer un rendez-vous le 21 aout pour un trajet dont les depots
courent du 2 au 4 septembre.

Desormais :
- l ecran de prise de rendez-vous charge le trajet de la commande et
  affiche la periode de depot fixee par le transporteur ;
- le champ date est borne (attributs min et max) et un validateur refuse
  toute date hors plage, avec un message qui rappelle les bornes ;
- si la periode est deja passee, un encadre orange le signale et invite
  a contacter le transporteur.

La plage est l offre du transporteur, le rendez-vous l engagement du
client a l interieur de cette offre.

## Fichiers

- shared/utils/date-format.ts : NOUVEAU. formatDateHeure() affiche
  "12/08/2026 a 14:30" quand l'heure existe, "12/08/2026" sinon, ce qui
  permet de melanger anciennes et nouvelles donnees sans rien casser.
  maintenantISO() horodate a la minute.
- models/livraison.model.ts : + dateMiseEnTransport, + historique[]
- core/services/livraisons.ts : chaque mise a jour ajoute une entree
  a l'historique et renseigne les horodatages. La livraison est relue
  avant ecriture pour ne pas ecraser l'historique existant.
- models/reclamation.model.ts : + datePriseEnCharge
- core/services/reclamations.ts : horodatage des trois etapes
- features/suivi/suivi-livraison/ : ts + html + css
- features/espace-client/reclamations/ : ts + html + css
- features/espace-transporteur/avis-reclamations/ : ts + html + css

## Installation

Dezipper a la racine, ng serve. Aucun script de migration : les nouveaux
champs sont optionnels et les anciennes donnees restent lisibles
(elles s'affichent sans heure, ce qui est correct).

## Tests

1. Transporteur -> MAJ livraison : passer une livraison en EN_COURS avec
   une position, enregistrer, puis la passer a LIVRE.
2. Client -> suivi de cette commande : les etapes portent leurs dates,
   et le "Journal des mises a jour" liste les deux modifications avec
   leur heure.
3. Verifier dans db.json que la livraison contient historique[],
   dateMiseEnTransport et dateLivraisonReelle.
4. Client -> ouvrir une reclamation : l'etape "Recue" affiche l'heure,
   "Prise en charge" indique "en attente".
5. Transporteur -> prendre en charge le dossier, puis repondre :
   cote client, les deux etapes se remplissent avec leurs horodatages.
