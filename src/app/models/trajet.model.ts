import { Transporteur } from './transporteur.model';

export interface Trajet {
  id: string;
  transporteurId: string;
  destination: string;
  prix: number;
  dateDepart: string;          // ISO : "2026-09-05T08:00"
  placesDisponibles: number;
  transporteur?: Transporteur; // rempli par GET /trajets/:id?_expand=transporteur
}