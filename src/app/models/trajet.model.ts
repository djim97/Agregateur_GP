import { Transporteur } from './transporteur.model';

export interface PlageReception {
  debut: string; // ISO "2026-09-01T08:00"
  fin: string;   // ISO "2026-09-04T18:00"
}

export interface Trajet {
  id: string;
  transporteurId: string;
  destination: string;
  dateDepart: string;              // ISO
  /** Tarif unique au kilo ; le prix d'une commande = poidsFacture x prixParKilo (décision 3) */
  prixParKilo: number;
  /** Capacité initiale du trajet en kg */
  capaciteKilosTotale: number;
  /** Kilos déjà réservés (croît à chaque commande) */
  kilosReserves: number;
  /** Marqué automatiquement : capacité atteinte OU plage de réception dépassée */
  complet: boolean;
  /** Fenêtre pendant laquelle le client peut déposer son colis */
  plageReception: PlageReception;
  transporteur?: Transporteur;     // _expand
}

/** Capacité restante (calculée, jamais stockée) */
export function capaciteRestante(t: Trajet): number {
  return Math.max(0, t.capaciteKilosTotale - t.kilosReserves);
}

/** Le trajet est-il effectivement complet ? (champ OU conditions dynamiques) */
export function estComplet(t: Trajet, maintenant: Date = new Date()): boolean {
  if (t.complet) return true;
  if (t.kilosReserves >= t.capaciteKilosTotale) return true;
  if (new Date(t.plageReception.fin).getTime() < maintenant.getTime()) return true;
  return false;
}
