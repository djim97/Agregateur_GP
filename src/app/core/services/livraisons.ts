import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, of } from 'rxjs';
import { Livraison } from '../../models/livraison.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Livraisons {
  readonly #http = inject(HttpClient);

  /** Une commande a au plus une livraison associée */
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
   * Met à jour une livraison ; au passage à "LIVRE" :
   *  - horodate dateLivraisonReelle (alimente les indicateurs du dashboard)
   *  - bascule la commande associée en "LIVREE"
   * JSON Server n'a pas de transaction : les PATCH sont chaînés par switchMap.
   */
  updateAvecCommande(id: string, patch: Partial<Livraison>): Observable<Livraison> {
    const patchComplet: Partial<Livraison> =
      patch.statut === 'LIVRE' && !patch.dateLivraisonReelle
        ? { ...patch, dateLivraisonReelle: new Date().toISOString().slice(0, 10) }
        : patch;

    return this.#http.patch<Livraison>(`${API}/livraisons/${id}`, patchComplet).pipe(
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
