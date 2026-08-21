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

- Rôle administrateur (nécessaire pour les points 1 et 2 ci-dessus).
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
