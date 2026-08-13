/**
 * CONTRAT DE ROUTES v1 (validé A + B)
 * Ne pas modifier sans accord des deux membres + commit dédié.
 * Référence : docs/contrat-de-routes.pdf
 */
export const PATHS = {
  // ----- Périmètre A (Djimouna) -----
  login: 'login',
  register: 'register',
  trajets: 'trajets',
  trajetDetail: (id: string) => ['/trajets', id],
  nouvelleCommande: 'commandes/nouvelle',

  // ----- Périmètre B (Said) -----
  transporteurs: 'transporteurs',
  nouveauRdv: 'rendezvous/nouveau',
  mesCommandes: 'mes-commandes',
  suivi: (commandeId: string) => ['/suivi', commandeId],
  espaceTransporteur: 'espace-transporteur',
  livraisonDetail: (id: string) => ['/espace-transporteur/livraisons', id],
} as const;

/** Noms des paramètres du contrat : id · commandeId · trajetId · returnUrl */
export const QUERY = {
  returnUrl: 'returnUrl',
  trajetId: 'trajetId',
  commandeId: 'commandeId',
} as const;