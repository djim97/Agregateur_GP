import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { Livraison, EtapeLivraison } from '../../models/livraison.model';
import { maintenantISO } from '../../shared/utils/date-format';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Livraisons {
  readonly #http = inject(HttpClient);

  getByCommande(commandeId: string): Observable<Livraison | null> {
    return this.#http
      .get<Livraison[]>(`${API}/livraisons`, { params: { commandeId } })
      .pipe(map(liste => liste[0] ?? null));
  }

  getById(id: string): Observable<Livraison> {
    return this.#http.get<Livraison>(`${API}/livraisons/${id}`);
  }

  getAll(): Observable<Livraison[]> {
    return this.#http.get<Livraison[]>(`${API}/livraisons`);
  }

  update(id: string, patch: Partial<Livraison>): Observable<Livraison> {
    return this.#http.patch<Livraison>(`${API}/livraisons/${id}`, patch);
  }

  /**
   * Met a jour une livraison en HORODATANT chaque changement :
   *  - une entree est ajoutee a l'historique (statut, position, date et heure)
   *  - le passage en EN_COURS renseigne dateMiseEnTransport
   *  - le passage a LIVRE renseigne dateLivraisonReelle et bascule
   *    la commande associee en LIVREE
   * On relit d'abord la livraison pour ne pas ecraser l'historique existant
   * (JSON Server n'a pas de transaction : limite assumee).
   */
  updateAvecCommande(id: string, patch: Partial<Livraison>): Observable<Livraison> {
    const horodatage = maintenantISO();

    return this.getById(id).pipe(
      switchMap(actuelle => {
        const statut = patch.statut ?? actuelle.statut;
        const position = patch.positionActuelle ?? actuelle.positionActuelle;

        const etape: EtapeLivraison = { statut, positionActuelle: position, date: horodatage };
        const historique = [...(actuelle.historique ?? []), etape];

        const complet: Partial<Livraison> = { ...patch, historique };

        if (statut === 'EN_COURS' && !actuelle.dateMiseEnTransport) {
          complet.dateMiseEnTransport = horodatage;
        }
        if (statut === 'LIVRE' && !actuelle.dateLivraisonReelle) {
          complet.dateLivraisonReelle = horodatage;
        }

        return this.#http.patch<Livraison>(`${API}/livraisons/${id}`, complet);
      }),
      switchMap(livraison => {
        if (livraison.statut !== 'LIVRE') {
          return of(livraison);
        }
        return this.#http
          .patch(`${API}/commandes/${livraison.commandeId}`, { statut: 'LIVREE' })
          .pipe(map(() => livraison));
      })
    );
  }
}
