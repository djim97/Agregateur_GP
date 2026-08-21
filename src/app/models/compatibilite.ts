/**
 * ÉVOLUTION FRET : règle d'acceptation AUTOMATIQUE (décision 5).
 * Un trajet n'est proposé/accepté que s'il est compatible avec le colis.
 * Référence : docs/plan-evolution-fret.md § 5
 */
import { Trajet, estComplet } from './trajet.model';
import { Transporteur } from './transporteur.model';
import {
  Dimensions, NiveauFragilite,
  LISTE_GLOBALE_ILLICITE, estVolumineux, poidsFacture,
} from './produits';

export interface DescriptionColis {
  poids: number;
  dimensions: Dimensions;
  niveauFragilite: NiveauFragilite;
  categorieProduit: string;
}

export type MotifRefus =
  | 'ILLICITE_GLOBAL'
  | 'ILLICITE_TRANSPORTEUR'
  | 'FRAGILE_REFUSE'
  | 'VOLUMINEUX_REFUSE'
  | 'CAPACITE_INSUFFISANTE'
  | 'TRAJET_COMPLET';

export interface ResultatCompatibilite {
  compatible: boolean;
  motif?: MotifRefus;
}

/**
 * Applique toutes les règles du plan, dans l'ordre :
 * illicite global -> illicite transporteur -> contraintes INFORMEL
 * (fragile, volumineux) -> complet -> capacité.
 */
export function verifierCompatibilite(
  trajet: Trajet,
  transporteur: Transporteur,
  colis: DescriptionColis,
): ResultatCompatibilite {
  if (LISTE_GLOBALE_ILLICITE.includes(colis.categorieProduit)) {
    return { compatible: false, motif: 'ILLICITE_GLOBAL' };
  }
  if (transporteur.produitsIllicites.includes(colis.categorieProduit)) {
    return { compatible: false, motif: 'ILLICITE_TRANSPORTEUR' };
  }
  if (transporteur.type === 'INFORMEL') {
    if (colis.niveauFragilite !== 'AUCUNE') {
      return { compatible: false, motif: 'FRAGILE_REFUSE' };
    }
    if (estVolumineux(colis.dimensions)) {
      return { compatible: false, motif: 'VOLUMINEUX_REFUSE' };
    }
  }
  if (estComplet(trajet)) {
    return { compatible: false, motif: 'TRAJET_COMPLET' };
  }
  const facture = poidsFacture(colis.poids, colis.dimensions);
  if (trajet.kilosReserves + facture > trajet.capaciteKilosTotale) {
    return { compatible: false, motif: 'CAPACITE_INSUFFISANTE' };
  }
  return { compatible: true };
}

/** Messages utilisateur par motif (pour affichage) */
export const MESSAGES_REFUS: Record<MotifRefus, string> = {
  ILLICITE_GLOBAL: 'Ce type de produit est interdit au transport.',
  ILLICITE_TRANSPORTEUR: 'Ce transporteur ne prend pas ce type de produit.',
  FRAGILE_REFUSE: 'Les transporteurs informels ne prennent pas de produits fragiles.',
  VOLUMINEUX_REFUSE: 'Colis volumineux (L+l+h > 150 cm) : transporteur professionnel requis.',
  CAPACITE_INSUFFISANTE: 'Capacité restante insuffisante pour ce poids.',
  TRAJET_COMPLET: 'Ce trajet est complet.',
};
