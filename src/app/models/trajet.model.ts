import { Transporteur } from './transporteur.model';
import { CodeDevise, DEVISE_DEFAUT } from './devises';

export interface PlageReception {
  debut: string;
  fin: string;
}

export interface Trajet {
  id: string;
  transporteurId: string;
  destination: string;
  dateDepart: string;
  /** Tarif au kilo, exprimé dans la devise ci-dessous */
  prixParKilo: number;
  /** Devise choisie par le transporteur pour CE trajet (XOF par défaut) */
  devise: CodeDevise;
  capaciteKilosTotale: number;
  kilosReserves: number;
  complet: boolean;
  plageReception: PlageReception;
  transporteur?: Transporteur;
}

export function capaciteRestante(t: Trajet): number {
  return Math.max(0, t.capaciteKilosTotale - t.kilosReserves);
}

export function estComplet(t: Trajet, maintenant: Date = new Date()): boolean {
  if (t.complet) return true;
  if (t.kilosReserves >= t.capaciteKilosTotale) return true;
  if (new Date(t.plageReception.fin).getTime() < maintenant.getTime()) return true;
  return false;
}

/** Devise d'un trajet, avec repli sur le franc CFA pour les données anciennes */
export function deviseTrajet(t: Trajet | null | undefined): CodeDevise {
  return t?.devise ?? DEVISE_DEFAUT;
}
