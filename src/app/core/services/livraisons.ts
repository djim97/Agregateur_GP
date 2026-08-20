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

  // B4 — livraison par id
  getById(id: string): Observable<Livraison> {
    return this.#http.get<Livraison>(`${API}/livraisons/${id}`);
  }

  update(id: string, patch: Partial<Livraison>): Observable<Livraison> {
    return this.#http.patch<Livraison>(`${API}/livraisons/${id}`, patch);
  }

  /**
   * Met à jour une livraison ; si elle passe à "LIVRE",
   * bascule aussi la commande associée en "LIVREE".
   * (JSON Server n'a pas de transaction : les deux PATCH sont chaînés
   *  par switchMap, le second n'ayant lieu que si la livraison est livrée.)
   */
  updateAvecCommande(id: string, patch: Partial<Livraison>): Observable<Livraison> {
    return this.#http.patch<Livraison>(`${API}/livraisons/${id}`, patch).pipe(
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