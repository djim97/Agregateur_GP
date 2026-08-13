export type StatutCommande = 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE';

export interface Commande {
  id: string;
  clientId: string;
  trajetId: string;
  statut: StatutCommande;
  poids: number;
  description: string;
  dateCommande: string;
}