/**
 * Devises de facturation et conversion pour l'agrégation.
 *
 * DEUX USAGES DISTINCTS, à ne pas confondre :
 *
 *  1. FACTURATION : le transporteur fixe le tarif de CHAQUE trajet dans la
 *     devise de son choix (souvent celle du pays de départ). Ce montant est
 *     affiché et facturé tel quel, SANS aucune conversion. C'est la règle.
 *
 *  2. AGRÉGATION : pour totaliser un chiffre d'affaires réparti sur
 *     plusieurs devises, il faut bien les ramener à une unité commune.
 *     Le transporteur choisit sa DEVISE DE RÉFÉRENCE dans son profil,
 *     et le tableau de bord convertit vers celle-ci. Le détail par devise
 *     reste affiché à côté du total.
 *
 * SUR LES TAUX :
 *  - EUR est un taux FIXE et définitif : le franc CFA (XOF) est arrimé à
 *    l'euro à 1 EUR = 655,957 XOF. Cette valeur ne change pas.
 *  - Les autres devises FLUCTUENT. Les valeurs ci-dessous sont des ordres
 *    de grandeur, suffisants pour un total indicatif, mais elles doivent
 *    venir d'une source de taux en production (voir NOTES-EVOLUTIONS.md).
 *    C'est pourquoi tout montant converti est présenté comme approximatif.
 */

export const DEVISES = [
  { code: 'XOF', symbole: 'FCFA', libelle: 'Franc CFA (XOF)',        decimales: 0, xofPourUne: 1 },
  { code: 'EUR', symbole: '€',    libelle: 'Euro (EUR)',             decimales: 2, xofPourUne: 655.957 },
  { code: 'USD', symbole: '$',    libelle: 'Dollar US (USD)',        decimales: 2, xofPourUne: 600 },
  { code: 'GBP', symbole: '£',    libelle: 'Livre sterling (GBP)',   decimales: 2, xofPourUne: 760 },
  { code: 'JPY', symbole: '¥',    libelle: 'Yen (JPY)',              decimales: 0, xofPourUne: 4.1 },
  { code: 'AED', symbole: 'AED',  libelle: 'Dirham EAU (AED)',       decimales: 2, xofPourUne: 163 },
  { code: 'MAD', symbole: 'MAD',  libelle: 'Dirham marocain (MAD)',  decimales: 2, xofPourUne: 60 },
  { code: 'CAD', symbole: 'CAD',  libelle: 'Dollar canadien (CAD)',  decimales: 2, xofPourUne: 440 },
  { code: 'CNY', symbole: 'CNY',  libelle: 'Yuan (CNY)',             decimales: 2, xofPourUne: 84 },
] as const;

export type CodeDevise = (typeof DEVISES)[number]['code'];

export const DEVISE_DEFAUT: CodeDevise = 'XOF';

/** Le taux EUR est fixe (arrimage) ; les autres sont indicatifs */
export const DEVISES_TAUX_FIXE: string[] = ['XOF', 'EUR'];

export function devise(code: string | undefined | null) {
  return DEVISES.find(d => d.code === code) ?? DEVISES[0];
}

/**
 * Formate un montant dans sa devise.
 *  formatMontant(7500, 'XOF') -> "7 500 FCFA"
 *  formatMontant(11.5, 'EUR') -> "11,50 €"
 */
export function formatMontant(montant: number | null | undefined, code: string | undefined | null): string {
  if (montant == null) return '';
  const d = devise(code);
  const nombre = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: d.decimales,
    maximumFractionDigits: d.decimales,
  }).format(montant);
  return `${nombre} ${d.symbole}`;
}

/** Arrondi cohérent avec la devise (pas de centimes sur le franc CFA) */
export function arrondirMontant(montant: number, code: string | undefined | null): number {
  const d = devise(code);
  const facteur = Math.pow(10, d.decimales);
  return Math.round(montant * facteur) / facteur;
}

/**
 * Conversion pour l'AGRÉGATION uniquement (jamais pour facturer).
 * Passe par le franc CFA comme pivot.
 */
export function convertir(montant: number, depuis: string, vers: string): number {
  if (depuis === vers) return montant;
  const enXof = montant * devise(depuis).xofPourUne;
  return arrondirMontant(enXof / devise(vers).xofPourUne, vers);
}

/** Le total converti repose-t-il uniquement sur des taux fixes ? */
export function conversionExacte(devisesUtilisees: string[], reference: string): boolean {
  return [...devisesUtilisees, reference].every(d => DEVISES_TAUX_FIXE.includes(d));
}
