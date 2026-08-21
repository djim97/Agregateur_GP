import { Pipe, PipeTransform } from '@angular/core';
import { formatMontant } from '../../models/devises';

/**
 * Usage : {{ trajet.prixParKilo | montant: trajet.devise }}
 * Affiche le montant dans la devise choisie par le transporteur,
 * sans aucune conversion.
 */
@Pipe({ name: 'montant' })
export class MontantDevisePipe implements PipeTransform {
  transform(montant: number | null | undefined, codeDevise: string | null | undefined): string {
    return formatMontant(montant, codeDevise);
  }
}
