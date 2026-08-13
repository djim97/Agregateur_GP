export type StatutLivraison = 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE';

export interface Livraison {
  id: string;
  commandeId: string;
  statut: StatutLivraison;
  positionActuelle: string;
  dateEstimee: string;
}