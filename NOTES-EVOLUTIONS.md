# Notes d'évolution (à traiter plus tard)

Consigné le 21/08/2026. Ces points sont identifiés mais NON implémentés.

## 1. Vérification du NINEA

Aujourd'hui le NINEA est saisi librement à l'inscription d'un transporteur
professionnel : aucun contrôle de format ni d'existence réelle.

À prévoir :
- Validation de FORMAT côté client (le NINEA sénégalais est composé de 7 chiffres
  puis d'un code d'établissement, ex. 0057214893A2). Un pattern Angular suffit
  pour cette première barrière.
- Vérification d'EXISTENCE : nécessite une source officielle. Pistes à explorer :
  API de l'Agence de Développement et d'Encadrement des PME, registre du commerce,
  ou à défaut une validation MANUELLE par un administrateur.
- Conséquence produit : tant que le NINEA n'est pas vérifié, le transporteur
  professionnel devrait porter un statut "en attente de vérification"
  (badge distinct sur son profil, éventuellement impossibilité de publier
  des trajets). Cela implique un champ `nineaVerifie: boolean` sur Transporteur
  et un écran d'administration.
- Question ouverte : qui vérifie ? Il n'existe pas encore de rôle "admin"
  dans l'application (seulement client et transporteur).

## 2. Service d'envoi d'emails

Aujourd'hui aucune notification n'est envoyée : tout se passe dans l'interface.

À prévoir :
- Vérification de la VALIDITÉ de l'email à la création du compte (en amont) :
  envoi d'un lien ou d'un code de confirmation, compte inactif tant que
  l'email n'est pas confirmé. Implique un champ `emailVerifie: boolean`
  et un écran "vérifiez votre boîte mail".
- Emails transactionnels à déclencher :
  - inscription : bienvenue + lien de confirmation
  - commande créée : récapitulatif au client, notification au transporteur
  - rendez-vous confirmé par le transporteur : confirmation au client
  - colis reçu / déposé : accusé de réception
  - livraison mise à jour : changement de statut
  - trajet complet : information aux clients concernés
- Contrainte technique : JSON Server ne peut pas envoyer d'emails. Il faudra
  un vrai backend (Node/Express, ou un service tiers type Resend, SendGrid,
  Mailgun, Brevo) et donc migrer hors de json-server, ou ajouter un petit
  serveur d'envoi à côté.
- Prévoir aussi les préférences de notification par utilisateur
  (tout recevoir / essentiel seulement).

## 3. Autres points en attente

- Rôle ADMINISTRATEUR (décidé : à créer plus tard).
  Le modèle actuel ne connaît que deux rôles, client et transporteur.
  Un rôle admin est nécessaire pour plusieurs choses déjà identifiées :
  - Traiter les réclamations GÉNÉRALES, celles qui ne portent pas sur une
    commande précise. Aujourd'hui elles n'ont aucun destinataire : le
    routage vers le transporteur ne fonctionne que pour les réclamations
    liées à une commande. Ces dossiers restent donc "Ouverts" sans suite.
  - Arbitrer en NIVEAU 2 quand le client conteste la réponse du
    transporteur (modèle des marketplaces : le prestataire répond d'abord,
    la plateforme tranche ensuite). Implique un bouton "contester" côté
    client et un statut supplémentaire (ESCALADEE par exemple).
  - Vérifier et valider les NINEA des transporteurs professionnels
    (voir point 1 de ce document).
  - Modérer les avis (signalement d'un avis abusif ou diffamatoire).
  À cadrer avant de coder :
  - Ajouter 'admin' au type Role, et un roleGuard sur un espace dédié.
  - Comment crée-t-on un admin ? Pas par le formulaire d'inscription
    public : plutôt un compte posé directement en base au départ.
  - Quels écrans : file des réclamations non attribuées, file des
    escalades, file des NINEA à vérifier, modération des avis.
- Option "récupération du colis par le transporteur" (payante).
  Le flux actuel est simple et assumé : le client DÉPOSE son colis
  pendant la plage de réception du transporteur. L'évolution consiste
  à proposer, en plus, que le transporteur vienne CHERCHER le colis
  chez le client contre des frais supplémentaires.
  À cadrer avant de coder :
  - Tarification : montant fixe par enlèvement, ou variable selon la
    distance ou la zone ? Le transporteur fixe-t-il lui-même ce tarif
    (nouveau champ sur son profil ou sur le trajet), ou est-il défini
    par la plateforme ?
  - Disponibilité : tous les transporteurs proposent-ils l'enlèvement,
    ou est-ce une option que chacun active (booléen `enlevementPropose`
    + `fraisEnlevement` sur Transporteur ou sur Trajet) ?
  - Adresse d'enlèvement : à saisir par le client au moment de la
    commande (elle n'existe pas encore dans le modèle Commande).
  - Impact sur le prix : les frais s'ajoutent au prix calculé
    (poidsFacturé x prixParKilo + fraisEnlevement) et doivent apparaître
    dans le récapitulatif tarifaire en direct du formulaire de commande.
  - Impact sur le rendez-vous : un enlèvement est un RDV chez le client,
    pas un dépôt chez le transporteur. Le modèle RendezVous aurait besoin
    d'un type (DEPOT | ENLEVEMENT) et d'une adresse.
  - Contrainte informel/professionnel : un transporteur informel qui
    voyage avec ses colis peut-il réellement assurer des enlèvements ?
    À trancher (probablement réservé aux professionnels).
- Données de démonstration internationales (trajets Dakar -> Paris en AVION)
  pour illustrer l'ouverture annoncée sur l'accueil.

## 4. Documents, traçabilité et signature

- ÉDITION DES DOCUMENTS DE LIVRAISON. Générer et fournir les pièces
  qui accompagnent un envoi : bordereau d'expédition avec code-barres
  ou QR code, étiquette à coller sur le colis, bon de livraison,
  facture, et pour l'international la déclaration de contenu douanière
  (type CN22 / CN23) et la lettre de voiture (CMR pour la route,
  LTA pour l'aérien). Techniquement : génération PDF, soit côté client
  (jsPDF, pdfmake) soit côté serveur quand le vrai backend existera.
  Prérequis : des mentions légales complètes (NINEA vérifié, adresses),
  d'où le lien avec les points 1 et 3.

- SUIVI GPS EN TEMPS RÉEL. Aujourd'hui la position est un texte saisi
  à la main par le transporteur ("Rufisque"). Le suivi réel suppose :
  une application ou un mobile côté transporteur qui émet sa position,
  un canal temps réel (WebSocket ou polling), le stockage d'un
  historique de points, et une carte côté client (Leaflet avec
  OpenStreetMap, ou Google Maps). Questions à trancher : consentement
  et vie privée du transporteur, fréquence d'émission, consommation
  de batterie et de données, comportement hors couverture réseau.

- SIGNATURE ÉLECTRONIQUE. Faire signer la remise et la réception du
  colis : signature tracée au doigt sur mobile (canvas), horodatée,
  associée à la livraison, avec éventuellement une photo du colis
  remis et le nom du signataire. Valeur probante en cas de litige,
  ce qui alimente directement le traitement des réclamations
  (point 3). Pour une vraie valeur juridique, il faudrait un
  prestataire de signature qualifié ; pour l'usage courant, une
  signature simple horodatée suffit généralement à prouver la remise.

## 5. Modèle économique : comment la plateforme gagne de l'argent

Aucune monétisation n'est implémentée à ce jour. Pistes classiques
pour ce type de place de marché, à évaluer et à combiner :

- COMMISSION SUR TRANSACTION. Un pourcentage prélevé sur chaque
  commande (souvent 5 à 20 % selon les places de marché). C'est le
  modèle le plus courant et le plus aligné : la plateforme gagne
  quand les transporteurs gagnent. Suppose d'encaisser le paiement,
  donc d'intégrer un moyen de paiement (Wave, Orange Money, PayDunya,
  Stripe) et de reverser au transporteur après livraison confirmée.
- ABONNEMENT TRANSPORTEUR. Forfait mensuel pour publier des trajets,
  éventuellement par paliers (nombre de trajets, mise en avant).
  Revenu prévisible, mais barrière à l'entrée pour les informels.
- MISE EN AVANT PAYANTE. Position privilégiée dans les résultats de
  recherche ou sur l'accueil, badge "sponsorisé" clairement affiché.
- SERVICES OPTIONNELS FACTURÉS. Assurance du colis, récupération à
  domicile (voir point 3), emballage, livraison express.
- FRAIS DE SERVICE CÔTÉ CLIENT. Petit montant fixe ajouté au prix,
  affiché séparément.
- DONNÉES ET OUTILS PRO. Tableaux de bord avancés, exports comptables,
  API pour les transporteurs professionnels, en formule payante.

Points d'attention : la commission n'a de sens que si le paiement
transite par la plateforme (sinon rien n'empêche de traiter en direct
après la mise en relation, problème classique des places de marché) ;
et le modèle doit rester supportable pour les transporteurs informels,
qui font la spécificité de la plateforme.

## 6. Taux de change et source de donnees

Le transporteur facture chaque trajet dans la devise de son choix, sans
conversion : c'est la regle et elle ne change pas. En revanche, pour
TOTALISER un chiffre d'affaires reparti sur plusieurs devises, le tableau
de bord convertit vers la devise de reference choisie dans le profil.

Etat actuel : les taux sont ecrits en dur dans models/devises.ts.
- Le taux EUR est FIXE et definitif (1 EUR = 655,957 XOF, arrimage du
  franc CFA) : aucune maintenance necessaire.
- Les autres devises FLUCTUENT. Les valeurs actuelles sont des ordres de
  grandeur. Le total affiche porte un signe "environ" des qu'une devise
  a taux variable entre dans le calcul.

A faire plus tard :
- Brancher une source de taux (API de change) avec mise en cache
  quotidienne et repli sur la derniere valeur connue en cas de panne.
- Historiser le taux applique a chaque commande, sinon un chiffre
  d'affaires passe change de valeur quand les taux bougent.
- Ne JAMAIS utiliser ces taux pour facturer : uniquement pour agreger
  et comparer. Le montant du a un transporteur reste celui de sa devise.

## 7. Recherche et devises

Le transporteur fixe désormais son tarif dans la devise de son choix
(francs CFA, euro, dollar, yen...). La plateforme n'applique AUCUNE
conversion : le prix affiché est celui qu'il a saisi.

Conséquence à traiter plus tard : le filtre "prix max par kilo" de la
recherche compare des nombres bruts, sans tenir compte de la devise.
Un maximum de 1 000 laisse donc passer un trajet à 900 EUR/kg comme un
trajet à 900 FCFA/kg. Pistes :
- filtrer par devise en même temps que par prix (le client choisit
  la devise dans laquelle il exprime son budget) ;
- ou n'appliquer le filtre qu'aux trajets de la devise sélectionnée ;
- ou, si un jour la plateforme encaisse les paiements, introduire une
  conversion pour la comparaison seulement (avec une source de taux),
  en continuant d'afficher et de facturer dans la devise d'origine.

Même remarque pour le tri par prix, et pour tout futur cumul de
chiffre d'affaires : le tableau de bord affiche déjà un total PAR
devise plutôt qu'une somme unique, car additionner des francs CFA et
des euros n'aurait pas de sens.
