export type StatutLivraison = 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE';

/** Une entrée de l'historique : ce qui a change, quand, et ou */
export interface EtapeLivraison {
  statut: StatutLivraison;
  positionActuelle: string;
  /** Horodatage a la minute : "2026-08-21T14:30" */
  date: string;
}

export interface Livraison {
  id: string;
  commandeId: string;
  statut: StatutLivraison;
  positionActuelle: string;
  dateEstimee: string;
  /** Horodatage du passage en transport */
  dateMiseEnTransport?: string;
  /** Horodatage de la livraison effective (alimente aussi les indicateurs) */
  dateLivraisonReelle?: string;
  /** Trace de toutes les mises a jour, la plus recente en dernier */
  historique?: EtapeLivraison[];
}
