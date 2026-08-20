import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

  update(id: string, patch: Partial<Livraison>): Observable<Livraison> {
    return this.#http.patch<Livraison>(`${API}/livraisons/${id}`, patch);
  }
}