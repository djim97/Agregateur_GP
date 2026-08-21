export type StatutReclamation = 'OUVERTE' | 'EN_TRAITEMENT' | 'RESOLUE';

export const MOTIFS_RECLAMATION = [
  'Colis endommagé',
  'Colis non reçu',
  'Retard de livraison',
  'Erreur de facturation',
  'Comportement du transporteur',
  'Autre',
] as const;

export interface Reclamation {
  id: string;
  clientId: string;
  /** Commande concernée (optionnelle : une réclamation peut être générale) */
  commandeId?: string;
  /**
   * Transporteur destinataire, déduit de la commande à la création.
   * Absent = réclamation générale, sans destinataire (voir NOTES-EVOLUTIONS.md).
   */
  transporteurId?: string;
  motif: string;
  description: string;
  statut: StatutReclamation;
  dateCreation: string;
  /** Horodatage de la prise en charge par le transporteur */
  datePriseEnCharge?: string;
  /** Réponse du transporteur */
  reponse?: string;
  dateReponse?: string;
}
