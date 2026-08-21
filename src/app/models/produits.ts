/**
 * ÉVOLUTION FRET : catégories de produits, listes d'interdiction,
 * et calculs de poids (volumétrique / facturé / volumineux).
 * Référence : docs/plan-evolution-fret.md (décisions 3, 4, 6)
 */

/** Catégories proposées au client à la commande */
export const CATEGORIES_PRODUITS = [
  'vetements',
  'electronique',
  'documents',
  'alimentaire',
  'cosmetiques',
  'pieces-detachees',
  'meubles',
  'autre',
] as const;

export type CategorieProduit = (typeof CATEGORIES_PRODUITS)[number];

/** Liste GLOBALE : interdite pour TOUS les transporteurs, non contournable (décision 6) */
export const LISTE_GLOBALE_ILLICITE: string[] = [
  'armes',
  'drogues',
  'produits-inflammables',
  'especes-protegees',
  'contrefacons',
];

export type NiveauFragilite = 'AUCUNE' | 'FRAGILE' | 'TRES_FRAGILE';

export interface Dimensions {
  L: number; // longueur (cm)
  l: number; // largeur  (cm)
  h: number; // hauteur  (cm)
}

/** Poids volumétrique du secteur (aérien) : (L x l x h) / 5000, en kg (décision 3) */
export function poidsVolumetrique(d: Dimensions): number {
  return (d.L * d.l * d.h) / 5000;
}

/** Poids facturé = max(poids réel, poids volumétrique) (décision 3) */
export function poidsFacture(poidsReel: number, d: Dimensions): number {
  return Math.max(poidsReel, poidsVolumetrique(d));
}

/** Colis volumineux si L + l + h > 150 cm (standard Colissimo, décision 4) */
export function estVolumineux(d: Dimensions): boolean {
  return d.L + d.l + d.h > 150;
}
