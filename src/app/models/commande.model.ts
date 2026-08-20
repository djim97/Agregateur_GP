import { Dimensions, NiveauFragilite } from './produits';

export type StatutCommande = 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE';

export interface Commande {
  id: string;
  clientId: string;
  trajetId: string;
  statut: StatutCommande;
  dateCommande: string;
  description: string;
  /** Poids réel du colis (kg) */
  poids: number;
  /** Dimensions en cm : sert au poids volumétrique ET au critère "volumineux" */
  dimensions: Dimensions;
  /** max(poids réel, poids volumétrique), figé à la commande */
  poidsFacture: number;
  /** poidsFacture x prixParKilo du trajet, figé à la commande */
  prixCalcule: number;
  niveauFragilite: NiveauFragilite;
  categorieProduit: string;
}
