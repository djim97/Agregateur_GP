export interface Avis {
  id: string;
  commandeId: string;
  clientId: string;
  /** Transporteur noté : permet de retrouver ses avis sans recroiser les trajets */
  transporteurId?: string;
  note: number;
  commentaire: string;
  date: string;
}

/** Moyenne des notes, arrondie au dixième (0 si aucun avis) */
export function moyenneAvis(avis: Avis[]): number {
  if (avis.length === 0) return 0;
  const somme = avis.reduce((s, a) => s + a.note, 0);
  return Math.round((somme / avis.length) * 10) / 10;
}
