/** Qui est évalué par cet avis */
export type CibleAvis = 'TRANSPORTEUR' | 'CLIENT';

export interface Avis {
  id: string;
  commandeId: string;
  /** Client concerné : auteur si cible = TRANSPORTEUR, évalué si cible = CLIENT */
  clientId: string;
  /** Transporteur concerné : évalué si cible = TRANSPORTEUR, auteur si cible = CLIENT */
  transporteurId?: string;
  /**
   * Sens de l'avis. Absent sur les données antérieures : on considère
   * alors qu'il s'agit d'un avis du client sur le transporteur.
   */
  cible?: CibleAvis;
  note: number;
  commentaire: string;
  date: string;
}

/** Sens effectif d'un avis, avec repli pour les données anciennes */
export function cibleAvis(a: Avis): CibleAvis {
  return a.cible ?? 'TRANSPORTEUR';
}

/** Avis portant sur les transporteurs (déposés par des clients) */
export function avisSurTransporteurs(liste: Avis[]): Avis[] {
  return liste.filter(a => cibleAvis(a) === 'TRANSPORTEUR');
}

/** Avis portant sur les clients (déposés par des transporteurs) */
export function avisSurClients(liste: Avis[]): Avis[] {
  return liste.filter(a => cibleAvis(a) === 'CLIENT');
}

/** Moyenne des notes, arrondie au dixième (0 si aucun avis) */
export function moyenneAvis(avis: Avis[]): number {
  if (avis.length === 0) return 0;
  const somme = avis.reduce((s, a) => s + a.note, 0);
  return Math.round((somme / avis.length) * 10) / 10;
}
