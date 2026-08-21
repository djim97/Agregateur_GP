import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, throwError, map } from 'rxjs';
import { Commande } from '../../models/commande.model';
import { Trajet } from '../../models/trajet.model';
import { DescriptionColis, verifierCompatibilite, MESSAGES_REFUS } from '../../models/compatibilite';
import { poidsFacture } from '../../models/produits';
import { arrondirMontant, DEVISE_DEFAUT } from '../../models/devises';

const API = 'http://localhost:3000';

/** Erreur métier : le colis n'est pas accepté sur ce trajet (motif inclus) */
export class ColisRefuseError extends Error {
  constructor(public motifMessage: string) {
    super(motifMessage);
  }
}

export interface NouvelleCommande extends DescriptionColis {
  clientId: string;
  trajetId: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class Commandes {
  readonly #http = inject(HttpClient);

  /**
   * ÉVOLUTION FRET : création en 3 étapes chaînées (switchMap).
   *  1. GET frais du trajet (+ transporteur) : re-vérifier la COMPATIBILITÉ
   *     (illicite, fragile/volumineux selon type, capacité, complet)
   *  2. POST /commandes avec poidsFacture et prixCalcule figés
   *  3. PATCH /trajets/:id : kilosReserves += poidsFacture
   *     (+ complet: true si la capacité est atteinte)
   * JSON Server n'a pas de transaction : limite assumée, documentée.
   */
  creer(nouvelle: NouvelleCommande): Observable<Commande> {
    return this.#http
      .get<Trajet>(`${API}/trajets/${nouvelle.trajetId}?_expand=transporteur`)
      .pipe(
        switchMap(trajet => {
          const verdict = verifierCompatibilite(trajet, trajet.transporteur!, nouvelle);
          if (!verdict.compatible) {
            return throwError(() => new ColisRefuseError(MESSAGES_REFUS[verdict.motif!]));
          }

          const facture = Math.round(poidsFacture(nouvelle.poids, nouvelle.dimensions) * 100) / 100;
          // Le prix est calculé ET stocké dans la devise du trajet.
          const deviseTrajet = trajet.devise ?? DEVISE_DEFAUT;
          const prix = arrondirMontant(facture * trajet.prixParKilo, deviseTrajet);

          const commande = {
            clientId: nouvelle.clientId,
            trajetId: nouvelle.trajetId,
            statut: 'EN_ATTENTE' as const,
            dateCommande: new Date().toISOString().slice(0, 10),
            description: nouvelle.description,
            poids: nouvelle.poids,
            dimensions: nouvelle.dimensions,
            poidsFacture: facture,
            prixCalcule: prix,
            devise: deviseTrajet,
            niveauFragilite: nouvelle.niveauFragilite,
            categorieProduit: nouvelle.categorieProduit,
          };

          const nouveauxKilos = trajet.kilosReserves + facture;
          const patchTrajet: Partial<Trajet> = { kilosReserves: nouveauxKilos };
          if (nouveauxKilos >= trajet.capaciteKilosTotale) {
            patchTrajet.complet = true;   // complet automatique (décision, plan § 8)
          }

          return this.#http.post<Commande>(`${API}/commandes`, commande).pipe(
            switchMap(creee =>
              this.#http
                .patch<Trajet>(`${API}/trajets/${trajet.id}`, patchTrajet)
                .pipe(map(() => creee))
            )
          );
        })
      );
  }

  getByClient(clientId: string): Observable<Commande[]> {
    return this.#http.get<Commande[]>(`${API}/commandes`, { params: { clientId } });
  }
}
