import { Dimensions, NiveauFragilite } from './produits';
import { CodeDevise } from './devises';

export type StatutCommande = 'EN_ATTENTE' | 'EN_COURS' | 'LIVREE';

export interface Commande {
  id: string;
  clientId: string;
  trajetId: string;
  statut: StatutCommande;
  dateCommande: string;
  description: string;
  poids: number;
  dimensions: Dimensions;
  poidsFacture: number;
  /** Prix figé à la commande, exprimé dans la devise ci-dessous */
  prixCalcule: number;
  /** Devise recopiée du trajet à la commande (le prix ne doit pas changer de sens) */
  devise: CodeDevise;
  niveauFragilite: NiveauFragilite;
  categorieProduit: string;
}
