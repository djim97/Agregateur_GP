export type StatutRdv = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE';

export interface RendezVous {
  id: string;
  commandeId: string;
  date: string;
  lieu: string;
  statut: StatutRdv;
}