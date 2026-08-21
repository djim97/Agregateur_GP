export type StatutLivraison = 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE';

export interface Livraison {
  id: string;
  commandeId: string;
  statut: StatutLivraison;
  positionActuelle: string;
  dateEstimee: string;
  /**
   * Date effective de livraison, renseignée automatiquement au passage
   * au statut LIVRE. Indispensable aux indicateurs du tableau de bord
   * (temps de livraison moyen, respect des délais).
   */
  dateLivraisonReelle?: string;
}
